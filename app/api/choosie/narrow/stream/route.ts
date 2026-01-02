import { NextRequest } from "next/server";
import { sseResponse, publish } from "@/lib/sse";
import prisma from "@/lib/prisma";
import { computeNarrowingPlan } from "@/lib/planner";

export const runtime = "nodejs";

async function buildInitialState(listId: string) {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: { items: { orderBy: { rank: 'asc' } }, progress: true },
  });
  if (!list) return null;
  const tasteJson: any = list.tasteJson || {};
  const invitees = Array.isArray(tasteJson.event?.invitees) ? tasteJson.event.invitees : [];
  const participants = tasteJson.participants || (invitees.filter((x: any) => typeof x !== 'string').length + 1) || 2;
  const plan = computeNarrowingPlan(list.items.length, participants, { participants });
  let state: any = list.progress?.historyJson || null;
  if (!state) {
    state = { plan, roundIndex: 0, rounds: [], current: { remainingIds: list.items.map((i: any) => i.id), selectedIds: [], target: plan[0] } };
  } else {
    if (!Array.isArray(state.plan)) state.plan = plan;
    const idx = typeof state.roundIndex === 'number' ? state.roundIndex : 0;
    state.current.target = state.plan[idx] ?? plan[idx] ?? 1;
  }
  return {
    listId,
    title: list.title,
    items: list.items.map((i: any) => ({ id: i.id, title: i.title })),
    state,
    winnerItemId: list.progress?.winnerItemId || null,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listId = searchParams.get('listId');
  if (!listId) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing listId' }), { status: 400 });
  }
  const initial = await buildInitialState(listId);
  if (!initial) {
    return new Response(JSON.stringify({ ok: false, error: 'List not found' }), { status: 404 });
  }
  return sseResponse(listId, { ok: true, event: 'initial', ...initial });
}

// Optional POST to force broadcast current state after mutation (can be called by action endpoints later)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const listId = body.listId;
  if (!listId) return new Response(JSON.stringify({ ok: false, error: 'Missing listId' }), { status: 400 });
  const state = await buildInitialState(listId);
  if (!state) return new Response(JSON.stringify({ ok: false, error: 'List not found' }), { status: 404 });
  publish(listId, { ok: true, event: 'update', ...state });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
