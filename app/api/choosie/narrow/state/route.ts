import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { validateRequest, getListSchema } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { computeNarrowingPlan } from "@/lib/planner";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rawBody = await req.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[narrow/state] JSON parse error:', parseErr);
      }
      return withCORS(NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 }), origin);
    }

    const rl = await rateLimit(req, { scope: 'narrowState', limit: 240, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    let data;
    try {
      data = validateRequest(getListSchema, body);
    } catch (validationErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[narrow/state] validation error:', validationErr);
      }
      return withCORS(NextResponse.json({ ok: false, error: 'Invalid or missing listId' }, { status: 400 }), origin);
    }
    let list = null;
    try {
      list = await prisma.list.findUnique({
        where: { id: data.listId },
        include: { items: { orderBy: { rank: 'asc' } }, progress: true },
      });
    } catch (prismaErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[narrow/state] Prisma error:', prismaErr);
      }
      return withCORS(NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 }), origin);
    }
    if (!list) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[narrow/state] List not found for id', data.listId);
      }
      return withCORS(NextResponse.json({ ok: false, error: 'List not found' }, { status: 404 }), origin);
    }
    // Build/normalize state and ensure plan/target are present
    const tasteJson = (list.tasteJson || {}) as Record<string, any>;
    const invitees: Array<{ token: string }> = Array.isArray(tasteJson.event?.invitees) ? tasteJson.event.invitees : [];
    const participantCount =
      typeof tasteJson.participants === "number"
        ? tasteJson.participants
        : Array.isArray(invitees)
        ? invitees.filter((x: any) => typeof x !== "string").length || 1
        : 1;
    const participants = participantCount + 1;
    const plan = computeNarrowingPlan(list.items.length, participants, { participants });
    let state = (list.progress?.historyJson as Record<string, any> | null) || null;
    const initialState = {
      plan,
      roundIndex: 0,
      rounds: [],
      current: {
        remainingIds: list.items.map((i: any) => i.id),
        selectedIds: [],
        target: plan[0],
      },
    };
    if (!state) {
      state = initialState;
    } else {
      const hasCompletedRounds = Array.isArray(state.rounds) && state.rounds.length > 0;
      const hasStalePlan = JSON.stringify(state.plan || []) !== JSON.stringify(plan);
      if (hasStalePlan && !hasCompletedRounds) {
        state = initialState;
      }
      if (!Array.isArray(state.current?.remainingIds)) state.current = { remainingIds: list.items.map((i: any) => i.id), selectedIds: [], target: plan[0] };
      if (!Array.isArray(state.current?.selectedIds)) state.current.selectedIds = [];
      if (!Array.isArray(state.plan)) state.plan = plan;
      const idx = typeof state.roundIndex === 'number' ? state.roundIndex : 0;
      state.current.target = state.plan[idx] ?? plan[idx] ?? 1;
    }
    // Persist normalized state if changed
    try {
      await prisma.progress.upsert({
        where: { listId: list.id },
        update: { historyJson: state },
        create: { listId: list.id, historyJson: state },
      });
    } catch (prismaUpsertErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[narrow/state] Prisma upsert error:', prismaUpsertErr);
      }
      return withCORS(NextResponse.json({ ok: false, error: 'Database upsert error' }, { status: 500 }), origin);
    }

    const winnerItemId = list.progress?.winnerItemId || null;
    return withCORS(NextResponse.json({
      ok: true,
      state,
      winnerItemId,
      participantCount,
      listTitle: list.title,
      listDescription: list.description || null,
      items: list.items.map((i: any) => ({
        id: i.id,
        title: i.title,
        notes: i.notes,
        image: i.imageUrl || null
      }))
    }), origin);
  } catch (e: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[narrow/state] Caught error:', e);
    }
    return withCORS(NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
