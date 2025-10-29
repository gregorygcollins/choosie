import { NextRequest, NextResponse } from "next/server";
import { getListById, upsertProgress } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const origin = getOrigin(req);
    const rl = rateLimit(req, { scope: "finalizeWatchlist", limit: 30, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);
  const body = await req.json();
  const session = await auth();
    const listId = body?.listId as string;
    const winnerId = body?.winnerId as string | undefined;
    const winnerTitle = body?.winnerTitle as string | undefined;
    if (!listId) {
      const res400 = NextResponse.json({ ok: false, error: "Missing listId" }, { status: 400 });
      return withCORS(res400, getOrigin(req));
    }

    const list = await getListById(listId);
    if (!list) {
      const res404 = NextResponse.json({ ok: false, error: "List not found" }, { status: 404 });
      return withCORS(res404, getOrigin(req));
    }
    if (session?.user?.id && list.userId !== session.user.id) {
      const res403 = NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      return withCORS(res403, getOrigin(req));
    }

    // resolve winner id by title if needed
    let resolvedWinnerId = winnerId;
    if (!resolvedWinnerId && winnerTitle) {
      const found = list.items.find((i) => i.title.toLowerCase() === winnerTitle.toLowerCase());
      if (found) resolvedWinnerId = found.id;
    }

    if (!resolvedWinnerId) {
      const res400b = NextResponse.json({ ok: false, error: "Missing winnerId or matching winnerTitle" }, { status: 400 });
      return withCORS(res400b, origin);
    }

    // Update progress with winner and clear history
    await upsertProgress(listId, {}, resolvedWinnerId);

  const updatedList = await getListById(listId);
    const res = NextResponse.json({
      ok: true,
      winnerId: resolvedWinnerId,
      list: updatedList
        ? {
            id: updatedList.id,
            title: updatedList.title,
            items: updatedList.items.map((it) => ({
              id: it.id,
              title: it.title,
              notes: it.notes,
              image: it.imageUrl,
            })),
            createdAt: updatedList.createdAt.toISOString(),
            winnerId: resolvedWinnerId,
          }
        : undefined,
    });
    return withCORS(res, origin);
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 400 });
    return withCORS(res, getOrigin(req));
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
