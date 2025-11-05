import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import "./auth.types"; // Import type augmentation

// Build providers conditionally based on available env vars
const providers: any[] = [];

console.log("[NextAuth] Checking environment variables...");
console.log("[NextAuth] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing");
console.log("[NextAuth] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✓ Set" : "✗ Missing");
console.log("[NextAuth] GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID ? "✓ Set" : "✗ Missing");
console.log("[NextAuth] GITHUB_CLIENT_SECRET:", process.env.GITHUB_CLIENT_SECRET ? "✓ Set" : "✗ Missing");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
  console.log("[NextAuth] ✓ Google provider enabled");
} else {
  console.warn("[NextAuth] ✗ Google provider disabled (missing credentials)");
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
  console.log("[NextAuth] ✓ GitHub provider enabled");
} else {
  console.warn("[NextAuth] ✗ GitHub provider disabled (missing credentials)");
}

// Ensure at least one provider is configured
if (providers.length === 0) {
  console.error("[NextAuth] FATAL: No authentication providers configured!");
  console.error("[NextAuth] Please set one of the following in your environment:");
  console.error("[NextAuth]   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
  console.error("[NextAuth]   - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET");
  throw new Error("NextAuth: No providers configured. Check environment variables.");
}

console.log(`[NextAuth] ✓ Successfully initialized with ${providers.length} provider(s)`);

const config = {
  // Use database sessions with Prisma adapter
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" as const },
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(error: Error) {
      console.error("[NextAuth][error]", error);
    },
    warn(code: string) {
      console.warn("[NextAuth][warn]", code);
    },
    debug(code: string, metadata?: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.log("[NextAuth][debug]", code, metadata);
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        console.log("SignIn callback - Success:", { 
          userId: user.id, 
          email: user.email,
          provider: account?.provider 
        });
        return true;
      } catch (error) {
        console.error("[NextAuth] signIn callback error:", error);
        // Return true anyway to allow sign-in even if logging fails
        return true;
      }
    },
    async redirect({ url, baseUrl }: any) {
      try {
        console.log("[NextAuth][debug] redirect callback", { url, baseUrl });
        
        // Relative URLs -> resolve against base
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        
        // Parse the URL to check origin and extract callbackUrl if present
        const u = new URL(url);
        const b = new URL(baseUrl);
        
        // If same origin, check for callbackUrl in query params
        if (u.origin === b.origin) {
          const callbackUrl = u.searchParams.get("callbackUrl");
          if (callbackUrl) {
            // Return the callbackUrl if it's relative or same-origin
            if (callbackUrl.startsWith("/")) {
              console.log("[NextAuth][debug] Using callbackUrl from params:", callbackUrl);
              return `${baseUrl}${callbackUrl}`;
            }
            try {
              const callbackURL = new URL(callbackUrl);
              if (callbackURL.origin === b.origin) {
                console.log("[NextAuth][debug] Using same-origin callbackUrl:", callbackUrl);
                return callbackUrl;
              }
            } catch {
              // Invalid callbackUrl, ignore
            }
          }
          // No callbackUrl or invalid, return the original url
          return url;
        }
        
        // Different origin -> return baseUrl to avoid host drift
        console.log("[NextAuth][debug] Different origin, returning baseUrl");
        return baseUrl;
      } catch (e) {
        console.warn("[NextAuth][warn] redirect parsing failed, falling back to baseUrl", e);
        return baseUrl;
      }
    },
    // With database sessions, default session content is sufficient
  },
  events: {
    async error(error: unknown) {
      console.error("[NextAuth][events.error]", error);
    },
    async signIn(message: unknown) {
      console.log("[NextAuth][events.signIn]", message);
    },
    async session(message: unknown) {
      console.log("[NextAuth][events.session]", message);
    },
  },
  pages: {
    error: "/auth/error",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
export const { GET, POST } = handlers;
