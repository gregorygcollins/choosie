import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../../lib/auth.server";

export async function GET() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto");
  const session = await auth();
  // Return minimal, non-sensitive debug info
  return NextResponse.json({
    ok: true,
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
      trustHost: true,
    },
    request: {
      host,
      proto,
    },
    session: session ? {
      user: {
        id: (session.user as any)?.id || null,
        email: (session.user as any)?.email || null,
        name: (session.user as any)?.name || null,
      }
    } : null,
  });
}
