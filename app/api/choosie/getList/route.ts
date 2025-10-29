import { NextRequest, NextResponse } from "next/server";
import { getListById } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const origin = getOrigin(req);
    const rl = rateLimit(req, { scope: "getList", limit: 120, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);
  const body = await req.json();
  const session = await auth();
    const listId = body?.listId as string;
    if (!listId) {
      const res400 = NextResponse.json({ ok: false, error: "Missing listId" }, { status: 400 });
      return withCORS(res400, getOrigin(req));
    }
    const list = await getListById(listId);
    if (!list) {
      const res404 = NextResponse.json({ ok: false, error: "List not found" }, { status: 404 });
      return withCORS(res404, getOrigin(req));
    }
    // Enforce ownership if signed in
    if (session?.user?.id && list.userId !== session.user.id) {
      const res403 = NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      return withCORS(res403, getOrigin(req));
    }
    const res = NextResponse.json({
      ok: true,
      list: {
        id: list.id,
        title: list.title,
        items: list.items.map((it) => ({
          id: it.id,
          title: it.title,
          notes: it.notes,
          image: it.imageUrl,
        })),
        createdAt: list.createdAt.toISOString(),
        winnerId: list.progress?.winnerItemId,
        progress: list.progress?.historyJson,
      },
    });
    return withCORS(res, getOrigin(req));
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 400 });
    return withCORS(res, getOrigin(req));
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
