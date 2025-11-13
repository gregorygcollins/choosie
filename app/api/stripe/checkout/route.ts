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
  // Create checkout session and redirect the browser (no JSON parsing on client)
  const origin = getOrigin(req);
  const session = await auth();
  if (!session?.user?.id) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/auth/login?callbackUrl=/account`, 302);
  }

  const userId = session.user.id as string;
  const email = (session.user as any).email as string | undefined;
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error("Stripe not configured:", e);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/account?error=stripe_not_configured`, 302);
  }

  async function resolvePriceId(): Promise<string | null> {
    if (process.env.STRIPE_PRICE_ID) return process.env.STRIPE_PRICE_ID;
    if (process.env.STRIPE_PRICE_LOOKUP_KEY) {
      try {
        const prices = await stripe.prices.list({ lookup_keys: [process.env.STRIPE_PRICE_LOOKUP_KEY], active: true, limit: 1 });
        if (prices.data[0]?.id) return prices.data[0].id;
      } catch {}
    }
    if (process.env.STRIPE_PRODUCT_ID) {
      try {
        const product = await stripe.products.retrieve(process.env.STRIPE_PRODUCT_ID, { expand: ["default_price"] } as any);
        const dp: any = (product as any).default_price;
        if (dp?.id) return dp.id as string;
      } catch {}
    }
    return null;
  }

  const priceId = await resolvePriceId();
  if (!priceId) {
    // Go back to account with an error message
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/account?error=stripe_price_missing`, 302);
  }

  const successUrl = (process.env.NEXTAUTH_URL || origin) + 
    "/account?checkout=success";
  const cancelUrl = (process.env.NEXTAUTH_URL || origin) + 
    "/account?checkout=cancelled";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: undefined,
      customer_email: email,
      metadata: { userId },
      subscription_data: {
        description: "Choosie Pro subscription",
      },
    });
    return NextResponse.redirect(checkoutSession.url!, 303);
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    // On error, return to account with an error message to show
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || origin}/account?error=checkout_failed`, 302);
  }
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

  const userId = session.user.id as string;
  const email = (session.user as any).email as string | undefined;

  const stripe = getStripe();

  async function resolvePriceId(): Promise<string | null> {
    // 1) Direct price ID
    if (process.env.STRIPE_PRICE_ID) return process.env.STRIPE_PRICE_ID;

    // 2) Lookup key (recommended in Stripe)
    if (process.env.STRIPE_PRICE_LOOKUP_KEY) {
      try {
        const prices = await stripe.prices.list({
          lookup_keys: [process.env.STRIPE_PRICE_LOOKUP_KEY],
          active: true,
          limit: 1,
        });
        if (prices.data[0]?.id) return prices.data[0].id;
      } catch (e) {
        console.warn("Failed to resolve price via STRIPE_PRICE_LOOKUP_KEY:", e);
      }
    }

    // 3) Product default price
    if (process.env.STRIPE_PRODUCT_ID) {
      try {
        const product = await stripe.products.retrieve(process.env.STRIPE_PRODUCT_ID, {
          expand: ["default_price"],
        } as any);
        const dp: any = (product as any).default_price;
        if (dp?.id) return dp.id as string;
      } catch (e) {
        console.warn("Failed to resolve default price from STRIPE_PRODUCT_ID:", e);
      }
    }

    return null;
  }

  const priceId = await resolvePriceId();
  if (!priceId) {
    const res = NextResponse.json({ ok: false, error: "Server not configured: set STRIPE_PRICE_ID, or STRIPE_PRICE_LOOKUP_KEY, or STRIPE_PRODUCT_ID with a default price" }, { status: 500 });
    return withCORS(res, origin);
  }

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
      customer: customerId,
      customer_email: customerId ? undefined : email,
      metadata: { userId },
      subscription_data: {
        description: "Choosie Pro subscription",
      },
    });

    const res = NextResponse.json({ ok: true, url: checkoutSession.url });
    return withCORS(res, origin);
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    const res = NextResponse.json({ ok: false, error: err?.message || "Failed to create checkout session" }, { status: 500 });
    return withCORS(res, origin);
  }
}
