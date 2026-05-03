import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth.server";
import prisma from "../../../lib/prisma";

export const runtime = "nodejs"; // ensure consistent environment for prisma

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: true, user: null });
  }
  // Load full user to include entitlement and Stripe billing linkage.
  let isPro = false;
  let subscription: {
    status: string | null;
    plan: string | null;
    currentPeriodEnd: string | null;
    hasStripeCustomer: boolean;
    hasStripeSubscription: boolean;
  } | null = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    isPro = dbUser?.isPro ?? false;
    const latest = dbUser?.subscriptions?.[0];
    if (latest) {
      subscription = {
        status: latest.status || null,
        plan: latest.plan || null,
        currentPeriodEnd: latest.currentPeriodEnd?.toISOString() || null,
        hasStripeCustomer: Boolean(latest.stripeCustomerId),
        hasStripeSubscription: Boolean(latest.stripeSubscriptionId),
      };
    }
  } catch (e) {
    console.warn("/api/me: prisma lookup failed; defaulting isPro=false", (e as any)?.message);
  }
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: (session.user as any).email,
    image: (session.user as any).image,
    isPro,
    subscription,
    hasStripeCustomer: subscription?.hasStripeCustomer || false,
    hasStripeSubscription: subscription?.hasStripeSubscription || false,
  } as any;
  return NextResponse.json({ ok: true, user, isPro, subscription });
}
