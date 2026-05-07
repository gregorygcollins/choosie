import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic"; // ensure edge/body parsing doesn't interfere
export const runtime = "nodejs"; // explicitly use Node.js runtime for raw body access

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_SECRET not set" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 400 });

  const body = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: `Webhook signature verification failed: ${err?.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any; // Stripe.Checkout.Session
        const customerId = String(session.customer || "");
        const subscriptionId = session.subscription ? String(session.subscription) : undefined;
        const email = session.customer_details?.email || session.customer_email || undefined;
        const userId = (session.metadata?.userId as string | undefined) || (await resolveUserIdByEmail(email));

        // Ensure we have a Subscription row linked to this user
        if (userId) {
          // Upsert subscription record
          const existing = await prisma.subscription.findFirst({ where: { userId } });
          if (!existing) {
            await prisma.subscription.create({
              data: { userId, stripeCustomerId: customerId || null, stripeSubscriptionId: subscriptionId || null, status: "created" },
            });
          } else {
            await prisma.subscription.update({
              where: { id: existing.id },
              data: { stripeCustomerId: customerId || existing.stripeCustomerId, stripeSubscriptionId: subscriptionId || existing.stripeSubscriptionId },
            });
          }
        }

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertFromStripeSubscription(sub, userId);
        } else if (customerId) {
          // No subscription yet but customer created
          await prisma.subscription.upsert({
            where: { stripeCustomerId: customerId },
            update: {},
            create: { userId: userId || (await resolveUserIdByCustomer(customerId)) || "", stripeCustomerId: customerId, status: "created" },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any; // Stripe.Subscription
        await upsertFromStripeSubscription(sub);
        break;
      }

      default:
        // ignore unhandled events
        break;
    }
  } catch (err: any) {
    // Log full error details server-side for debugging
    console.error("Stripe webhook handler error:", {
      error: err.message,
      stack: err.stack,
      eventType: event?.type,
      eventId: event?.id,
    });
    // Signal failure so Stripe retries delivery
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function upsertFromStripeSubscription(sub: any, hintedUserId?: string) {
  const customerId = String(sub.customer);
  const subscriptionId = String(sub.id);
  const status = String(sub.status);
  const priceId = sub.items?.data?.[0]?.price?.id as string | undefined;
  const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

  // Try to find an existing record by subscription or customer
  let existing = await prisma.subscription.findFirst({ where: { OR: [ { stripeSubscriptionId: subscriptionId }, { stripeCustomerId: customerId } ] } });

  // Resolve userId
  const userId = existing?.userId || hintedUserId || (await resolveUserIdByCustomer(customerId));

  if (!existing && userId) {
    existing = await prisma.subscription.findFirst({ where: { userId } });
  }

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        userId: userId || existing.userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status,
        plan: priceId,
        currentPeriodEnd: currentPeriodEnd || undefined,
      },
    });
  } else if (userId) {
    await prisma.subscription.create({
      data: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status,
        plan: priceId,
        currentPeriodEnd: currentPeriodEnd || undefined,
      },
    });
  }

  // Update user.isPro flag
  if (userId) {
    const isPro = status === "active" || status === "trialing";
    await prisma.user.update({ where: { id: userId }, data: { isPro } }).catch(() => {});
  }
}

async function resolveUserIdByCustomer(customerId: string): Promise<string | undefined> {
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId).catch(() => null);
  if (!customer || customer.deleted) return undefined;
  const metadataUserId = customer.metadata?.userId;
  if (metadataUserId) return metadataUserId;
  return resolveUserIdByEmail(customer.email || undefined);
}

async function resolveUserIdByEmail(email?: string | null): Promise<string | undefined> {
  if (!email) return undefined;
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  return user?.id;
}
