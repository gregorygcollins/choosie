import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import "./auth.types"; // Import type augmentation

// Build providers conditionally based on available env vars
const providers: any[] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
} else {
  console.warn("[NextAuth] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set — Google provider disabled.");
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
} else {
  console.warn("[NextAuth] GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET not set — GitHub provider disabled.")
}

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
