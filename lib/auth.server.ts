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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Email provider can be added later when SMTP is available
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Use NEXTAUTH_URL if set, otherwise use baseUrl
      const base = process.env.NEXTAUTH_URL || baseUrl;
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${base}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === base) return url;
      return base;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
