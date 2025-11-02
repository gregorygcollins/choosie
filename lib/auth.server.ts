import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import "./auth.types"; // Import type augmentation

const config = {
  // Temporarily use JWT instead of database sessions to isolate issue
  session: { strategy: "jwt" as const },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: true,
  logger: {
    error(error: Error) {
      console.error("[NextAuth][error]", error);
    },
    warn(code: string) {
      console.warn("[NextAuth][warn]", code);
    },
    debug(code: string, metadata?: unknown) {
      console.log("[NextAuth][debug]", code, metadata);
    },
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log("SignIn callback - Success:", { 
        userId: user.id, 
        email: user.email,
        provider: account?.provider 
      });
      return true;
    },
    async redirect({ url, baseUrl }: any) {
      try {
        console.log("[NextAuth][debug] redirect callback", { url, baseUrl });
        // Relative URLs -> resolve against base
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        const u = new URL(url);
        const b = new URL(baseUrl);
        // Same-origin allowed
        if (u.origin === b.origin) return url;
        // Otherwise, always return baseUrl to avoid host drift
        return baseUrl;
      } catch (e) {
        console.warn("[NextAuth][warn] redirect parsing failed, falling back to baseUrl", e);
        return baseUrl;
      }
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
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
