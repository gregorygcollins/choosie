import { NextRequest, NextResponse } from "next/server";
import { getListsForUser } from "@/lib/db";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { auth } from "@/lib/auth.server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = await rateLimit(req, { scope: "getMyLists", limit: 120, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const session = await auth();
    if (!session?.user?.id) {
      const res401 = NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      return withCORS(res401, origin);
    }

    const lists = await getListsForUser(session.user.id);
    const res = NextResponse.json({
      ok: true,
      lists: lists.map((l) => ({
        id: l.id,
        title: l.title,
        items: l.items.map((it) => ({ id: it.id, title: it.title, notes: it.notes, image: it.imageUrl })),
        createdAt: l.createdAt.toISOString(),
        moduleType:
          l.module === "BOOKS" ? "books" :
          l.module === "RECIPES" ? "food" :
          l.module === "ANYTHING" ? ((l as any).tasteJson?.module === "music" ? "music" : "anything") :
          "movies",
      })),
    });
    return withCORS(res, origin);
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 400 });
    return withCORS(res, origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
