import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

function maskDb(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      protocol: u.protocol,
      host: u.host,
      pathname: u.pathname,
      sslmode: u.searchParams.get("sslmode"),
      pgbouncer: u.searchParams.get("pgbouncer"),
    };
  } catch {
    return { raw: "unparseable" } as any;
  }
}

export async function GET() {
  const env = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    DATABASE_URL: maskDb(process.env.DATABASE_URL),
  } as const;

  // Connectivity + essential tables via Prisma
  let db = {
    connected: false,
    userCount: null as number | null,
    sessionCount: null as number | null,
    accountCount: null as number | null,
    error: null as string | null,
  };

  try {
    // Tiny health check
    await prisma.$queryRaw`SELECT 1`;
    db.connected = true;
    try { db.userCount = await prisma.user.count(); } catch {}
    try { db.sessionCount = await prisma.session.count(); } catch {}
    try { db.accountCount = await prisma.account.count(); } catch {}
  } catch (err: any) {
    db.error = err?.message || String(err);
  }

  return NextResponse.json({ ok: true, env, db });
}
