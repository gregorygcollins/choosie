import { NextRequest, NextResponse } from "next/server";
import { getListById, upsertProgress } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { validateOrigin, createErrorResponse, requireAuth } from "@/lib/security";
import { validateRequest, finalizeWatchlistSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    // Origin validation
    if (!validateOrigin(req)) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }),
        origin
      );
    }

    const body = await req.json();
    const validated = validateRequest(finalizeWatchlistSchema, body);

    const session = await auth();
    const list = await getListById(validated.listId);

    if (!list) {
      return withCORS(
        NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }),
        origin
      );
    }

    // Require authentication + ownership
    const authCheck = requireAuth(session, list.userId);
    if (!authCheck.ok) return withCORS(authCheck.response, origin);

    // Winner resolution
    let winnerId = validated.winnerId;
    if (!winnerId && validated.history?.winnerId) {
      winnerId = validated.history.winnerId;
    }

    if (!winnerId) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Winner ID required" }, { status: 400 }),
        origin
      );
    }

    await upsertProgress(validated.listId, validated.history || {}, winnerId);

    const updated = await getListById(validated.listId);

    return withCORS(
      NextResponse.json({
        ok: true,
        winnerId,
        list: updated
          ? {
              id: updated.id,
              title: updated.title,
              items: updated.items.map((it) => ({
                id: it.id,
                title: it.title,
                notes: it.notes,
                image: it.imageUrl,
              })),
              createdAt: updated.createdAt.toISOString(),
              winnerId,
            }
          : undefined,
      }),
      origin
    );
  } catch (e: any) {
    return withCORS(createErrorResponse(e, 400, "Failed to finalize watchlist"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}