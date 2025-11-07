import { NextResponse } from "next/server";

// Canonical host redirect to avoid cross-host auth state mismatches (e.g., PKCE/state cookies)
export function middleware(request: Request) {
  const url = new URL(request.url);
  const isProd = process.env.NODE_ENV === "production";
  // IMPORTANT: Use NEXT_PUBLIC_SITE_URL for canonical redirects so users stay on a single host.
  // Do not use NEXTAUTH_URL here; it's for NextAuth internals and may differ by env.
  const canonical = process.env.NEXT_PUBLIC_SITE_URL;

  // Never interfere with Stripe webhooks (signature depends on exact raw body + headers)
  if (url.pathname === "/api/stripe/webhook") {
    return NextResponse.next();
  }

  // Never interfere with NextAuth routes to avoid PKCE/state cookie mismatches
  if (url.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Allow Vercel preview/staging hosts through without canonical redirect so you can test new builds
  const host = url.host.toLowerCase();
  const vercelEnv = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development'
  const isVercel = process.env.VERCEL === "1";
  const isPreviewEnv = isVercel && vercelEnv && vercelEnv !== "production";
  const isPreviewHost = /\.vercel\.app$/i.test(host);
  if (isPreviewEnv || isPreviewHost) {
    return NextResponse.next();
  }

  if (isProd && canonical) {
    try {
      const c = new URL(canonical);
      const incomingHost = url.host;
      const canonicalHost = c.host;
      if (incomingHost !== canonicalHost) {
        const redirected = new URL(url.toString());
        redirected.host = canonicalHost;
        redirected.protocol = c.protocol; // ensure https
        return NextResponse.redirect(redirected.toString(), 308);
      }
    } catch (_) {
      // ignore parsing errors
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/(.*)"] };
