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
  pages: {
    error: "/auth/error",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
export const { GET, POST } = handlers;
