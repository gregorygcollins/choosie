import { NextRequest, NextResponse } from "next/server";
import { addItemToList, getListById } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { searchMovies } from "@/lib/tmdb";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { validateOrigin, createErrorResponse, requireAuth } from "@/lib/security";
import { validateRequest, addMovieSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    // Rate limiting
    const rl = await rateLimit(req, { scope: "addMovie", limit: 60, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    // Origin validation for CSRF protection
    if (!validateOrigin(req)) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }),
        origin
      );
    }

    const body = await req.json();
    const validatedData = validateRequest(addMovieSchema, body);
    
    const session = await auth();

    // Ownership check before modifying
    const listBefore = await getListById(validatedData.listId);
    if (!listBefore) {
      return withCORS(
        NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }),
        origin
      );
    }

    // Require authentication and ownership
    const authCheck = requireAuth(session, listBefore.userId);
    if (!authCheck.ok) {
      return withCORS(authCheck.response, origin);
    }

    // Try to enrich with TMDB poster and overview
    let image: string | null = null;
    let tmdbId: string | undefined;
    let overview: string | undefined;
    try {
      const results = await searchMovies(validatedData.title);
      if (results && results.length > 0) {
        image = results[0].poster;
        tmdbId = results[0].id?.toString();
        overview = (results[0].overview || "").toString().trim() || undefined;
      }
    } catch {
      // ignore TMDB errors for robustness
    }

    const item = await addItemToList(validatedData.listId, {
      title: validatedData.title,
      // If user didn't provide notes, use TMDB overview as a helpful summary
      notes: (validatedData.notes && validatedData.notes.trim().length > 0) ? validatedData.notes : overview,
      image,
      tmdbId,
    });
    
    if (!item) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Failed to add item" }, { status: 400 }),
        origin
      );
    }

    const list = await getListById(validatedData.listId);
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
    return withCORS(res, origin);
  } catch (e: any) {
    return withCORS(createErrorResponse(e, 400, "Failed to add movie"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
