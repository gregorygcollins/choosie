import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Email provider can be added later when SMTP is available
  ],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel deployments with preview URLs
  debug: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback:", { user, account, profile });
      return true;
    },
    async session({ session, user }) {
      console.log("Session callback:", { session, user });
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    error: "/auth/error",
  },
});
