import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import { verifyPassword } from "./password";
import "./auth.types"; // Import type augmentation

// Build providers conditionally based on available env vars
const providers: any[] = [];

const databaseUrl = process.env.DATABASE_URL || "";
const looksLocalDb = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const usePrismaAdapter = !!databaseUrl && !looksLocalDb;

providers.push(
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !verifyPassword(password, (user as any).passwordHash)) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      } catch (error) {
        console.error("Credentials sign-in failed", error);
        return null;
      }
    },
  })
);

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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = token.sub || (user.id as any);
      if (token?.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub as string },
            select: { isPro: true },
          });
          token.isPro = Boolean(dbUser?.isPro);
        } catch {
          token.isPro = false;
        }
      }
      return token;
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
      (session.user as any).isPro = Boolean(token?.isPro);
      return session;
    },
  },
  pages: {
    error: "/auth/error",
  },
});

export const { GET, POST } = handlers;
