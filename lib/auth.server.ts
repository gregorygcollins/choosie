import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import "./auth.types"; // Import type augmentation

// Build providers conditionally based on available env vars
const providers: any[] = [];

const databaseUrl = process.env.DATABASE_URL || "";
const looksLocalDb = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const usePrismaAdapter = !!databaseUrl && !looksLocalDb;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  // Provider not configured; skip
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  // Provider not configured; skip
}

// Ensure at least one provider is configured
if (providers.length === 0) {
  throw new Error("NextAuth: No providers configured. Set GOOGLE_CLIENT_ID/SECRET or GITHUB_CLIENT_ID/SECRET.");
}

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
    async jwt({ token, user }) {
      if (user?.id) token.sub = token.sub || (user.id as any);
      return token;
    },
    async signIn({ user, account }) {
      // Log sign-in attempts to help debug Configuration errors
      console.log("[NextAuth] signIn callback:", {
        hasUser: !!user,
        hasAccount: !!account,
        provider: account?.provider,
        usePrismaAdapter,
      });
      return true;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      const u = new URL(url);
      const b = new URL(baseUrl);
      if (u.origin === b.origin) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (token?.sub) (session.user as any).id = token.sub;
      return session;
    },
  },
  pages: {
    error: "/auth/error",
  },
});

export const { GET, POST } = handlers;
