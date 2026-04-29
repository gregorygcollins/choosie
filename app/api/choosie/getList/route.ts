import prisma from "@/lib/prisma";
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

      if (!list) return withCORS(NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }), origin);
      // Diagnostic logging for participants value
      // eslint-disable-next-line no-console
      // console.log('[API/getList] Returning participants:', list.participants); // Removed: property does not exist

    // Ownership check
    const authCheck = requireAuth(session, list.userId);
    if (!authCheck.ok) return withCORS(authCheck.response, origin);

    // Read participants from tasteJson for virtual narrowing
    const tasteJson = (list as any).tasteJson || {};
    const invitees = Array.isArray(tasteJson.event?.invitees) ? tasteJson.event.invitees : [];
    const participants = tasteJson.participants || (Array.isArray(invitees) ? invitees.filter((x: any) => typeof x !== 'string').length + 1 : undefined) || 2;


    // Ensure narrowing state is initialized
    let progress = list.progress;
    let winnerId = progress?.winnerItemId || null;
    let state = progress?.historyJson || null;
    const { computeNarrowingPlan } = await import("@/lib/planner");
    if (!state) {
      console.log('[getList] Initializing narrowing state for list', list.id);
      const plan = computeNarrowingPlan(list.items.length, participants, { participants });
      state = { plan, roundIndex: 0, rounds: [], current: { remainingIds: list.items.map((i: any) => i.id), selectedIds: [], target: plan[0] } };
      try {
        progress = await prisma.progress.upsert({
          where: { listId: list.id },
          update: { historyJson: state, winnerItemId: null },
          create: { listId: list.id, historyJson: state, winnerItemId: null },
        });
        winnerId = null;
        console.log('[getList] State after upsert', state);
      } catch (e) {
        console.error('[getList] Error during upsert', e);
      }
    }

    const res = NextResponse.json({
      ok: true,
      debug: "getList-logging-test-443d7e6",
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
            ? tasteJson?.module === "music"
              ? "music"
              : "anything"
            : "movies",
        winnerId,
        progress: state,
        participants,
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