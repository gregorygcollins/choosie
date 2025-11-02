import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import "./auth.types"; // Import type augmentation

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // Temporarily use JWT instead of database sessions to isolate issue
  session: { strategy: "jwt" },
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
      console.log("SignIn callback - Success:", { 
        userId: user.id, 
        email: user.email,
        provider: account?.provider 
      });
      return true;
    },
    async jwt({ token, user, account }) {
      // Add user ID to JWT token on sign in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session from JWT token
      if (session?.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    error: "/auth/error",
  },
});
