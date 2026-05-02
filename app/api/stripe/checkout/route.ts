import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth.server";
import { preflight, getOrigin, withCORS } from "../../../../lib/cors";
import { rateLimit } from "../../../../lib/rateLimit";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_bJefZgamYfGTcY7g6f6AM00";

function paymentLinkFor(email?: string | null) {
  if (!email) return STRIPE_PAYMENT_LINK;
  const url = new URL(STRIPE_PAYMENT_LINK);
  url.searchParams.set("prefilled_email", email);
  return url.toString();
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/auth/login?callbackUrl=/account`, 302);
  }

  const email = (session.user as any).email as string | undefined;
  return NextResponse.redirect(paymentLinkFor(email), 303);
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

  const email = (session.user as any).email as string | undefined;
  const res = NextResponse.json({ ok: true, url: paymentLinkFor(email) });
  return withCORS(res, origin);
}
