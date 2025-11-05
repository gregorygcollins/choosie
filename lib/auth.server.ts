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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
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
  },
  pages: {
    error: "/auth/error",
  },
});

export const { GET, POST } = handlers;
