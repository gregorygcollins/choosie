import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth.server";
import { getStripe } from "../../../../lib/stripe";
import type { Stripe } from "../../../../lib/stripe";
import prisma from "../../../../lib/prisma";
import { preflight, getOrigin, withCORS } from "../../../../lib/cors";
import { rateLimit } from "../../../../lib/rateLimit";

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/auth/login?callbackUrl=/account`, 302);
  }

  const userId = session.user.id as string;
  const sub = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!sub?.stripeCustomerId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/account?error=no_stripe_customer`, 302);
  }

  const returnUrl = (process.env.NEXTAUTH_URL || origin) + 
    "/account?portal=return";

  try {
    let stripe: Stripe;
    try {
      stripe = getStripe();
    } catch (e) {
      console.error("Stripe not configured:", e);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/account?error=stripe_not_configured`, 302);
    }
    // Ensure the customer exists in this Stripe mode; if not, guide the user back to create one via checkout
    // Retrieve the customer and verify mode alignment (test vs live)
    let customer: Stripe.Customer | Stripe.DeletedCustomer;
    try {
      customer = await stripe.customers.retrieve(sub.stripeCustomerId);
    } catch (e) {
      console.warn("No such Stripe customer for portal:", sub.stripeCustomerId);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/account?error=no_stripe_customer`, 302);
    }
    if ((customer as Stripe.DeletedCustomer).deleted) {
      console.warn("Stripe customer is deleted:", sub.stripeCustomerId);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/account?error=no_stripe_customer&reason=customer_deleted`, 302);
    }
    const keyIsLive = (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live");
    const customerIsLive = (customer as any)?.livemode === true;
    if (keyIsLive !== customerIsLive) {
      const reason = keyIsLive ? "live_key_test_customer" : "test_key_live_customer";
      console.warn("Stripe mode mismatch for portal:", { keyIsLive, customerIsLive, reason });
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || origin}/account?error=portal_failed&reason=${encodeURIComponent("mode_mismatch:" + reason)}`,
        302
      );
    }
    const configuration = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
      ...(configuration ? { configuration } : {}),
    });
    return NextResponse.redirect(portalSession.url!, 303);
  } catch (err) {
    console.error("Stripe portal session creation failed:", err);
    const anyErr = err as any;
    const reason = encodeURIComponent(anyErr?.message || anyErr?.code || "unknown");
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/account?error=portal_failed&reason=${reason}`, 302);
  }
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
