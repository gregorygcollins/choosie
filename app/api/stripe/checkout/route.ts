import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth.server";
import { preflight, getOrigin, withCORS } from "../../../../lib/cors";
import { rateLimit } from "../../../../lib/rateLimit";

const STRIPE_PAYMENT_LINKS = {
  monthly: "https://buy.stripe.com/5kQ14m0DP2J51qI6oDbjW00",
  annual: "https://buy.stripe.com/28E28q2LXgzV7P6aETbjW02",
} as const;

type BillingInterval = keyof typeof STRIPE_PAYMENT_LINKS;

function getBillingInterval(value?: string | null): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

function paymentLinkFor(interval: BillingInterval, email?: string | null) {
  const url = new URL(STRIPE_PAYMENT_LINKS[interval]);
  if (!email) return url.toString();
  url.searchParams.set("prefilled_email", email);
  return url.toString();
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  const billing = getBillingInterval(new URL(req.url).searchParams.get("billing"));
  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = `/api/stripe/checkout?billing=${billing}`;
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, 302);
  }

  const email = (session.user as any).email as string | undefined;
  return NextResponse.redirect(paymentLinkFor(billing, email), 303);
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  const limited = await rateLimit(req, { scope: "stripe-checkout", limit: 20, windowMs: 60_000 });
  if (limited.ok === false) return withCORS(limited.res, origin);

  const session = await auth();
  if (!session?.user?.id) {
    const res = NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    return withCORS(res, origin);
  }

  const body = await req.json().catch(() => ({}));
  const billing = getBillingInterval(body?.billing);
  const email = (session.user as any).email as string | undefined;
  const res = NextResponse.json({ ok: true, url: paymentLinkFor(billing, email) });
  return withCORS(res, origin);
}
