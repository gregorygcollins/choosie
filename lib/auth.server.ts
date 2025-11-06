import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import "./auth.types"; // Import type augmentation

// Build providers conditionally based on available env vars
const providers: any[] = [];

console.log("[NextAuth] Initializing authentication providers...");
console.log("[NextAuth] Checking environment variables...");
console.log("[NextAuth] NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "(unset)");
const databaseUrl = process.env.DATABASE_URL || "";
const looksLocalDb = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const usePrismaAdapter = !!databaseUrl && !looksLocalDb;
console.log("[NextAuth] DATABASE_URL:", databaseUrl ? (looksLocalDb ? "local (disabled in prod)" : "set") : "(unset)");
console.log("[NextAuth] Using PrismaAdapter:", usePrismaAdapter);
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Only use the Prisma adapter when a non-local database is configured.
  // This avoids OAuth failures in environments where DATABASE_URL points to localhost.
  ...(usePrismaAdapter ? { adapter: PrismaAdapter(prisma) } : {}),
  providers,
  trustHost: true,
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Log only minimal, non-sensitive info
      if (account?.provider) {
        console.log("[NextAuth][jwt] provider:", account.provider, "token.sub:", token?.sub);
      }
      if (user?.id) {
        token.sub = token.sub || (user.id as any);
      }
      return token;
    },
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
        return true;
      }
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      const u = new URL(url);
      const b = new URL(baseUrl);
      if (u.origin === b.origin) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      // Propagate id from token to session for server usage
      if (token?.sub) {
        (session.user as any).id = token.sub;
      }
      console.log("[NextAuth][session] userId:", (session.user as any)?.id || null);
      return session;
    },
  },
  pages: {
    error: "/auth/error",
  },
});

export const { GET, POST } = handlers;
