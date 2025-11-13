import { NextRequest, NextResponse } from "next/server";
import { getListById } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { validateOrigin, createErrorResponse, requireAuth } from "@/lib/security";
import { validateRequest, getListSchema } from "@/lib/validation";

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
    const validated = validateRequest(getListSchema, body);

    const session = await auth();
    const list = await getListById(validated.listId);

    if (!list) {
      return withCORS(
        NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }),
        origin
      );
    }

    // Ownership check
    const authCheck = requireAuth(session, list.userId);
    if (!authCheck.ok) return withCORS(authCheck.response, origin);

    const res = NextResponse.json({
      ok: true,
      list: {
        id: list.id,
        title: list.title,
        items: list.items.map((it) => ({
          id: it.id,
          title: it.title,
          notes: it.notes,
          image: it.imageUrl || null,
        })),
        createdAt: list.createdAt.toISOString(),
        moduleType:
          list.module === "BOOKS"
            ? "books"
            : list.module === "RECIPES"
            ? "food"
            : list.module === "ANYTHING"
            ? (list as any).tasteJson?.module === "music"
              ? "music"
              : "anything"
            : "movies",
        winnerId: list.progress?.winnerItemId,
        progress: list.progress?.historyJson,
      },
    });

    return withCORS(res, origin);
  } catch (e: any) {
    return withCORS(createErrorResponse(e, 400, "Failed to get list"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}