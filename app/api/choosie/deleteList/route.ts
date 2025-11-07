import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { deleteList as deleteListDb, getListById } from "@/lib/db";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { validateOrigin, createErrorResponse, requireAuth } from "@/lib/security";
import { validateRequest, getListSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    // Rate limit
    const rl = rateLimit(req, { scope: "deleteList", limit: 60, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    // Origin validation (CSRF protection)
    if (!validateOrigin(req)) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }),
        origin
      );
    }

    const body = await req.json();
    const { listId } = validateRequest(getListSchema, body);

  const session = await auth();

    // Fetch list to confirm ownership
    const list = await getListById(listId);
    if (!list) {
      return withCORS(
        NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }),
        origin
      );
    }

    // Enforce that the current user owns the list
    const authCheck = requireAuth(session, list.userId);
    if (!authCheck.ok) {
      // Allow deletion of anonymous/dev lists (created while signed-out)
      // Lists created while signed-out use the special userId 'dev-user-temp'
      if (list.userId !== "dev-user-temp") {
        return withCORS(authCheck.response, origin);
      }
      // If it's an anonymous/dev list, permit deletion even without a session
    }

    const deleted = await deleteListDb(listId);
    if (!deleted) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Delete failed" }, { status: 400 }),
        origin
      );
    }

    return withCORS(NextResponse.json({ ok: true }), origin);
  } catch (e) {
    return withCORS(createErrorResponse(e, 500, "Failed to delete list"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
