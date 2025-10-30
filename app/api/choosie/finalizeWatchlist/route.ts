import { NextRequest, NextResponse } from "next/server";
import { getListById, upsertProgress } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { validateOrigin, createErrorResponse, requireAuth } from "@/lib/security";
import { validateRequest, finalizeWatchlistSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    // Rate limiting
    const rl = rateLimit(req, { scope: "finalizeWatchlist", limit: 30, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    // Origin validation
    if (!validateOrigin(req)) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }),
        origin
      );
    }

    const body = await req.json();
    const validatedData = validateRequest(finalizeWatchlistSchema, body);
    
    const session = await auth();

    const list = await getListById(validatedData.listId);
    if (!list) {
      return withCORS(
        NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }),
        origin
      );
    }

    // Require authentication and ownership
    const authCheck = requireAuth(session, list.userId);
    if (!authCheck.ok) {
      return withCORS(authCheck.response, origin);
    }

    // Resolve winner id from history if needed
    let resolvedWinnerId = validatedData.winnerId;
    if (!resolvedWinnerId && validatedData.history) {
      // Extract winner from history structure if present
      // This is a placeholder - adjust based on actual history structure
      resolvedWinnerId = validatedData.history.winnerId;
    }

    if (!resolvedWinnerId) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Winner ID required" }, { status: 400 }),
        origin
      );
    }

    // Update progress with winner and history
    await upsertProgress(
      validatedData.listId,
      validatedData.history || {},
      resolvedWinnerId
    );

    const updatedList = await getListById(validatedData.listId);
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
    return withCORS(createErrorResponse(e, 400, "Failed to finalize watchlist"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
