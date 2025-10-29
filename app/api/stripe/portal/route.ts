import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth.server";
import { getStripe } from "../../../../lib/stripe";
import prisma from "../../../../lib/prisma";
import { preflight, getOrigin, withCORS } from "../../../../lib/cors";
import { rateLimit } from "../../../../lib/rateLimit";

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  const limited = rateLimit(req, { scope: "stripe-portal", limit: 20, windowMs: 60_000 });
  if (limited.ok === false) return withCORS(limited.res, origin);

  const session = await auth();
  if (!session?.user?.id) {
    const res = NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    return withCORS(res, origin);
  }

  const userId = session.user.id as string;
  const sub = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!sub?.stripeCustomerId) {
    const res = NextResponse.json({ ok: false, error: "No Stripe customer found. Start a subscription first." }, { status: 400 });
    return withCORS(res, origin);
  }

  const returnUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + 
    "/account?portal=return";

  try {
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });
    const res = NextResponse.json({ ok: true, url: portalSession.url });
    return withCORS(res, origin);
  } catch (err: any) {
    const res = NextResponse.json({ ok: false, error: err?.message || "Failed to create portal session" }, { status: 500 });
    return withCORS(res, origin);
  }
}
