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
    const rl = await rateLimit(req, { scope: 'narrowState', limit: 240, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json();
    const data = validateRequest(getListSchema, body);
    const list = await prisma.list.findUnique({
      where: { id: data.listId },
      include: { items: { orderBy: { rank: 'asc' } }, progress: true },
    });
    if (!list) {
      return withCORS(NextResponse.json({ ok: false, error: 'List not found' }, { status: 404 }), origin);
    }
    // Build/normalize state and ensure plan/target are present
    const tasteJson: any = list.tasteJson || {};
    const invitees = Array.isArray(tasteJson.event?.invitees) ? tasteJson.event.invitees : [];
    const participants = tasteJson.participants || (Array.isArray(invitees) ? invitees.filter((x: any) => typeof x !== 'string').length + 1 : undefined) || 2;
    const plan = computeNarrowingPlan(list.items.length, participants, { participants });
    let state: any = list.progress?.historyJson || null;
    if (!state) {
      state = { plan, roundIndex: 0, rounds: [], current: { remainingIds: list.items.map((i: any) => i.id), selectedIds: [], target: plan[0] } };
    } else {
      if (!Array.isArray(state.current?.remainingIds)) state.current = { remainingIds: list.items.map((i: any) => i.id), selectedIds: [], target: plan[0] };
      if (!Array.isArray(state.current?.selectedIds)) state.current.selectedIds = [];
      if (!Array.isArray(state.plan)) state.plan = plan;
      const idx = typeof state.roundIndex === 'number' ? state.roundIndex : 0;
      state.current.target = state.plan[idx] ?? plan[idx] ?? 1;
    }
    // Persist normalized state if changed
    await prisma.progress.upsert({
      where: { listId: list.id },
      update: { historyJson: state },
      create: { listId: list.id, historyJson: state },
    });

    const winnerItemId = list.progress?.winnerItemId || null;
    return withCORS(NextResponse.json({
      ok: true,
      state,
      winnerItemId,
      items: list.items.map((i: any) => ({
        id: i.id,
        title: i.title,
        notes: i.notes,
        image: i.imageUrl || null
      }))
    }), origin);
  } catch (e: any) {
    console.error('narrow/state error', e);
    return withCORS(NextResponse.json({ ok: false, error: e?.message || 'Internal error' }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}