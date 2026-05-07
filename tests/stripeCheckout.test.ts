import { describe, expect, it, vi } from "vitest";
import { createCheckoutSessionUrl, getBillingInterval, getCheckoutPriceId } from "../lib/stripeCheckout";

describe("stripe checkout helpers", () => {
  it("defaults unknown billing values to monthly", () => {
    expect(getBillingInterval("annual")).toBe("annual");
    expect(getBillingInterval("weekly")).toBe("monthly");
    expect(getBillingInterval(null)).toBe("monthly");
  });

  it("resolves monthly and annual price ids from env aliases", () => {
    expect(getCheckoutPriceId("monthly", { STRIPE_PRICE_ID: "price_default" })).toBe("price_default");
    expect(getCheckoutPriceId("monthly", { STRIPE_MONTHLY_PRICE_ID: "price_monthly" })).toBe("price_monthly");
    expect(getCheckoutPriceId("annual", { STRIPE_PRICE_ID_ANNUAL: "price_annual" })).toBe("price_annual");
    expect(getCheckoutPriceId("annual", {})).toBeNull();
  });

  it("creates a subscription Checkout Session with metadata and canonical urls", async () => {
    const create = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.test/session" });
    const stripe = { checkout: { sessions: { create } } };

    const url = await createCheckoutSessionUrl({
      billing: "annual",
      origin: "https://preview.example.com",
      userId: "user_123",
      email: "person@example.com",
      stripe,
      env: {
        STRIPE_ANNUAL_PRICE_ID: "price_annual",
        NEXT_PUBLIC_SITE_URL: "https://www.choosietogether.com/",
      },
    });

    expect(url).toBe("https://checkout.stripe.test/session");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_annual", quantity: 1 }],
        customer_email: "person@example.com",
        client_reference_id: "user_123",
        metadata: { userId: "user_123", billing: "annual" },
        subscription_data: { metadata: { userId: "user_123", billing: "annual" } },
        success_url: "https://www.choosietogether.com/account?checkout=success",
        cancel_url: "https://www.choosietogether.com/account?checkout=cancelled",
      })
    );
  });
});
