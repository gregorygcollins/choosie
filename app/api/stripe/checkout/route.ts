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
  const limited = rateLimit(req, { scope: "stripe-checkout", limit: 20, windowMs: 60_000 });
  if (limited.ok === false) return withCORS(limited.res, origin);

  const session = await auth();
  if (!session?.user?.id) {
    const res = NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    return withCORS(res, origin);
  }

  const userId = session.user.id as string;
  const email = (session.user as any).email as string | undefined;

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    const res = NextResponse.json({ ok: false, error: "Server not configured: STRIPE_PRICE_ID missing" }, { status: 500 });
    return withCORS(res, origin);
  }

  const stripe = getStripe();

  // Try to reuse existing Stripe customer if we have one
  const existingSub = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  const customerId = existingSub?.stripeCustomerId || undefined;

  const successUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + 
    "/account?checkout=success";
  const cancelUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000") + 
    "/account?checkout=cancelled";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // If we already have a customer, attach it; otherwise pass email and let Stripe create on completion
      customer: customerId,
      customer_email: customerId ? undefined : email,
      metadata: { userId },
    });

    const res = NextResponse.json({ ok: true, url: checkoutSession.url });
    return withCORS(res, origin);
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    const res = NextResponse.json({ ok: false, error: err?.message || "Failed to create checkout session" }, { status: 500 });
    return withCORS(res, origin);
  }
}
