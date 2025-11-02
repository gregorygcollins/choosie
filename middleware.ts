import { NextResponse } from "next/server";

// Canonical host redirect to avoid cross-host auth state mismatches (e.g., PKCE/state cookies)
export function middleware(request: Request) {
  const url = new URL(request.url);
  const isProd = process.env.NODE_ENV === "production";
  const canonical = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL;

  // Never interfere with Stripe webhooks (signature depends on exact raw body + headers)
  if (url.pathname === "/api/stripe/webhook") {
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
