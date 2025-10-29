import { NextRequest, NextResponse } from "next/server";
import { addItemToList, getListById } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { searchMovies } from "@/lib/tmdb";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const origin = getOrigin(req);
    const rl = rateLimit(req, { scope: "addMovie", limit: 60, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);
  const body = await req.json();
  const session = await auth();
    const listId = body?.listId as string;
    const title = body?.title as string;
    const notes = body?.notes as string | undefined;
    if (!listId || !title) {
      return NextResponse.json({ ok: false, error: "Missing listId or title" }, { status: 400 });
    }

    // try to enrich with TMDB poster
    let image: string | null = null;
    let tmdbId: string | undefined;
    try {
      const results = await searchMovies(title);
      if (results && results.length > 0) {
        image = results[0].poster;
        tmdbId = results[0].id?.toString();
      }
    } catch {
      // ignore TMDB errors for robustness
    }

    // Ownership check before modifying
    const listBefore = await getListById(listId);
    if (!listBefore) {
      const res404a = NextResponse.json({ ok: false, error: "List not found" }, { status: 404 });
      return withCORS(res404a, getOrigin(req));
    }
    if (session?.user?.id && listBefore.userId !== session.user.id) {
      const res403 = NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      return withCORS(res403, getOrigin(req));
    }

    const item = await addItemToList(listId, { title, notes, image, tmdbId });
    if (!item) {
      const res404 = NextResponse.json({ ok: false, error: "List not found" }, { status: 404 });
      return withCORS(res404, getOrigin(req));
    }

    const list = await getListById(listId);
    const res = NextResponse.json({
      ok: true,
      item: {
        id: item.id,
        title: item.title,
        notes: item.notes,
        image: item.imageUrl,
      },
      list: list
        ? {
            id: list.id,
            title: list.title,
            items: list.items.map((it) => ({
              id: it.id,
              title: it.title,
              notes: it.notes,
              image: it.imageUrl,
            })),
            createdAt: list.createdAt.toISOString(),
          }
        : undefined,
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
