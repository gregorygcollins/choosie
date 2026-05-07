export type BillingInterval = "monthly" | "annual";

type CheckoutSessionCreator = {
  checkout: {
    sessions: {
      create: (params: {
        mode: "subscription";
        line_items: Array<{ price: string; quantity: number }>;
        customer_email?: string;
        client_reference_id: string;
        metadata: { userId: string; billing: BillingInterval };
        subscription_data: { metadata: { userId: string; billing: BillingInterval } };
        allow_promotion_codes: boolean;
        success_url: string;
        cancel_url: string;
      }) => Promise<{ url?: string | null }>;
    };
  };
};

export function getBillingInterval(value?: string | null): BillingInterval {
  return value === "annual" ? "annual" : "monthly";
}

export function getCheckoutPriceId(interval: BillingInterval, env: NodeJS.ProcessEnv = process.env) {
  if (interval === "annual") {
    return env.STRIPE_ANNUAL_PRICE_ID || env.STRIPE_PRICE_ID_ANNUAL || null;
  }
  return env.STRIPE_MONTHLY_PRICE_ID || env.STRIPE_PRICE_ID_MONTHLY || env.STRIPE_PRICE_ID || null;
}

export function getCheckoutBaseUrl(origin: string, env: NodeJS.ProcessEnv = process.env) {
  return env.NEXT_PUBLIC_SITE_URL || env.NEXTAUTH_URL || origin;
}

export async function createCheckoutSessionUrl({
  billing,
  origin,
  userId,
  email,
  stripe,
  env = process.env,
}: {
  billing: BillingInterval;
  origin: string;
  userId: string;
  email?: string | null;
  stripe: CheckoutSessionCreator;
  env?: NodeJS.ProcessEnv;
}) {
  const priceId = getCheckoutPriceId(billing, env);
  if (!priceId) return null;

  const baseUrl = getCheckoutBaseUrl(origin, env).replace(/\/$/, "");
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
