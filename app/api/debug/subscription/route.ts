import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth.server";
import prisma from "../../../../lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const sub = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });

  return NextResponse.json({
    ok: true,
    user: {
      id: user?.id,
      email: (session.user as any).email,
      isPro: user?.isPro ?? false,
    },
    subscription: sub
      ? {
          id: sub.id,
          stripeCustomerId: sub.stripeCustomerId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          status: sub.status,
          plan: sub.plan,
          currentPeriodEnd: sub.currentPeriodEnd,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        }
      : null,
    timestamp: new Date().toISOString(),
  });
}
