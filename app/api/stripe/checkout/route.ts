import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth.server";
import { preflight, getOrigin, withCORS } from "../../../../lib/cors";
import { rateLimit } from "../../../../lib/rateLimit";
import { getStripe } from "../../../../lib/stripe";
import { BillingInterval, createCheckoutSessionUrl, getBillingInterval, getCheckoutBaseUrl } from "../../../../lib/stripeCheckout";
import prisma from "../../../../lib/prisma";

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
  const stripe = getStripe();
  return createCheckoutSessionUrl({
    billing,
    origin,
    userId,
    email,
    stripe,
  });
}

function missingPriceResponse(origin: string, billing: BillingInterval, wantsJson = false) {
  const baseUrl = getCheckoutBaseUrl(origin).replace(/\/$/, "");
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

function alreadyProResponse(origin: string, wantsJson = false) {
  const baseUrl = getCheckoutBaseUrl(origin).replace(/\/$/, "");
  if (wantsJson) {
    return NextResponse.json(
      { ok: false, error: "Pro is already active for this account.", reason: "already_pro" },
      { status: 409 }
    );
  }
  return NextResponse.redirect(`${baseUrl}/account?error=already_pro`, 302);
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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { isPro: true },
  });
  if (dbUser?.isPro) {
    return alreadyProResponse(origin);
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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { isPro: true },
  });
  if (dbUser?.isPro) {
    return withCORS(alreadyProResponse(origin, true), origin);
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
