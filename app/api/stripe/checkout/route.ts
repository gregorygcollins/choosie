import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth.server";
import { preflight, getOrigin, withCORS } from "../../../../lib/cors";
import { rateLimit } from "../../../../lib/rateLimit";
import { getStripe } from "../../../../lib/stripe";

type BillingInterval = "monthly" | "annual";

function getBillingInterval(value?: string | null): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

function getPriceId(interval: BillingInterval) {
  if (interval === "annual") {
    return (
      process.env.STRIPE_ANNUAL_PRICE_ID ||
      process.env.STRIPE_PRICE_ID_ANNUAL ||
      null
    );
  }
  return (
    process.env.STRIPE_MONTHLY_PRICE_ID ||
    process.env.STRIPE_PRICE_ID_MONTHLY ||
    process.env.STRIPE_PRICE_ID ||
    null
  );
}

function getBaseUrl(origin: string) {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || origin;
}

async function createCheckoutSession({
  billing,
  origin,
  userId,
  email,
}: {
  billing: BillingInterval;
  origin: string;
  userId: string;
  email?: string | null;
}) {
  const priceId = getPriceId(billing);
  if (!priceId) return null;

  const stripe = getStripe();
  const baseUrl = getBaseUrl(origin).replace(/\/$/, "");
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email || undefined,
    client_reference_id: userId,
    metadata: {
      userId,
      billing,
    },
    subscription_data: {
      metadata: {
        userId,
        billing,
      },
    },
    allow_promotion_codes: true,
    success_url: `${baseUrl}/account?checkout=success`,
    cancel_url: `${baseUrl}/account?checkout=cancelled`,
  });

  if (!checkout.url) throw new Error("Stripe did not return a checkout URL.");
  return checkout.url;
}

function missingPriceResponse(origin: string, billing: BillingInterval, wantsJson = false) {
  const baseUrl = getBaseUrl(origin).replace(/\/$/, "");
  const reason = billing === "annual" ? "missing_annual_price" : "missing_monthly_price";
  if (wantsJson) {
    return NextResponse.json(
      { ok: false, error: "Billing is not configured.", reason, billing },
      { status: 503 }
    );
  }
  return NextResponse.redirect(
    `${baseUrl}/account?error=stripe_price_missing&reason=${encodeURIComponent(reason)}`,
    302
  );
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
  const checkoutUrl = await createCheckoutSession({
    billing,
    origin,
    userId: session.user.id as string,
    email,
  });
  if (!checkoutUrl) return missingPriceResponse(origin, billing);
  return NextResponse.redirect(checkoutUrl, 303);
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
  const checkoutUrl = await createCheckoutSession({
    billing,
    origin,
    userId: session.user.id as string,
    email,
  });
  if (!checkoutUrl) return withCORS(missingPriceResponse(origin, billing, true), origin);
  const res = NextResponse.json({ ok: true, url: checkoutUrl });
  return withCORS(res, origin);
}
