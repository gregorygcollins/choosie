import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../../lib/auth.server";
import prisma from "../../../lib/prisma";
import { hashPassword, verifyPassword } from "../../../lib/password";

export const runtime = "nodejs"; // ensure consistent environment for prisma

const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()).optional(),
  currentPassword: z.string().max(128).optional(),
  newPassword: z.string().min(8).max(128).optional(),
  confirmPassword: z.string().min(8).max(128).optional(),
}).refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

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
  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
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
    name: dbUser?.name || session.user.name,
    email: dbUser?.email || (session.user as any).email,
    image: (session.user as any).image,
    isPro,
    subscription,
    hasStripeCustomer: subscription?.hasStripeCustomer || false,
    hasStripeSubscription: subscription?.hasStripeSubscription || false,
  } as any;
  return NextResponse.json({ ok: true, user, isPro, subscription });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateAccountSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid account details." }, { status: 400 });
  }

  const userId = session.user.id as string;
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const { name, email, currentPassword, newPassword } = parsed.data;
  const updates: { name?: string; email?: string; passwordHash?: string } = {};

  if (name !== undefined) updates.name = name;
  if (email !== undefined && email !== existing.email) {
    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== userId) {
      return NextResponse.json({ ok: false, error: "That email is already in use." }, { status: 409 });
    }
    updates.email = email;
  }

  if (newPassword) {
    if (existing.passwordHash && !verifyPassword(currentPassword || "", existing.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 400 });
    }
    updates.passwordHash = hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, user: existing });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: { id: true, name: true, email: true, isPro: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
