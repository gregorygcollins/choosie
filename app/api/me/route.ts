import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth.server";
import prisma from "../../../lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: true, user: null });
  }
  // Load full user to include billing flags
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: (session.user as any).email,
    image: (session.user as any).image,
    isPro: dbUser?.isPro ?? false,
  } as any;
  return NextResponse.json({ ok: true, user });
}
