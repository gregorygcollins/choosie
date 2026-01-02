import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { narrowingUndoRoundSchema, validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { computeNarrowingPlan } from "@/lib/planner";
import { publish } from "@/lib/sse";

export const runtime = "nodejs";

async function getList(listId: string) {
  return prisma.list.findUnique({
    where: { id: listId },
    include: { items: { orderBy: { rank: "asc" } }, progress: true },
  });
}

function extractInvitees(list: any): Array<any> {
  const tj = list.tasteJson as any || {};
  const invitees = Array.isArray(tj.event?.invitees) ? tj.event!.invitees : [];
  return invitees.filter((inv: any) => typeof inv !== 'string');
}

function buildCanonical(list: any) {
  const initialRemaining = list.items.map((i: any) => i.id);
  const defaultState = {
    plan: null as number[] | null,
    roundIndex: 0,
    rounds: [] as any[],
    current: { remainingIds: initialRemaining, selectedIds: [] as string[], target: 0 },
  };
  const state = (list.progress?.historyJson as any) || defaultState;
  if (!Array.isArray(state.current?.remainingIds)) state.current = { remainingIds: initialRemaining, selectedIds: [], target: 0 };
  if (!Array.isArray(state.current?.selectedIds)) state.current.selectedIds = [];
  return state;
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = await rateLimit(req, { scope: 'narrowUndo', limit: 100, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);
    const body = await req.json();
    const data = validateRequest(narrowingUndoRoundSchema, body);
    const list = await getList(data.listId);
    if (!list) {
      return withCORS(NextResponse.json({ ok: false, error: 'List not found' }, { status: 404 }), origin);
    }
    const invitees = extractInvitees(list);
    const participantIndex = invitees.findIndex((i: any) => i.token === data.participantToken);
    if (participantIndex < 0) {
      return withCORS(NextResponse.json({ ok: false, error: 'Invalid participant token' }, { status: 403 }), origin);
    }
    const participants = (list as any).tasteJson?.participants || (invitees.length + 1) || 2;
    const plan = computeNarrowingPlan(list.items.length, participants, { participants });
    const state = buildCanonical(list);
    if (!state.plan) state.plan = plan;
    // Can't undo if at first round or no previous rounds
    if (state.roundIndex <= 0 || !Array.isArray(state.rounds) || state.rounds.length === 0) {
      return withCORS(NextResponse.json({ ok: false, error: 'Nothing to undo' }, { status: 400 }), origin);
    }
    // Active index should point to previous round owner after undo
    const lastRound = state.rounds[state.rounds.length - 1];
    const expectedIndex = (state.roundIndex - 1) % (participants - 1);
    if (participantIndex !== expectedIndex) {
      return withCORS(NextResponse.json({ ok: false, error: 'Not your undo turn' }, { status: 409 }), origin);
    }
    // Restore previous remaining and remove last round
    state.rounds.pop();
    state.roundIndex -= 1;
    state.current.remainingIds = [...lastRound.prevRemaining];
    state.current.selectedIds = [...lastRound.chosenIds]; // restore selection set so user can adjust
    let winnerItemId: string | null = null;
    if (state.roundIndex >= state.plan.length) {
      winnerItemId = state.current.remainingIds[0] || null;
    }
    await prisma.progress.upsert({
      where: { listId: list.id },
      update: { historyJson: state, winnerItemId },
      create: { listId: list.id, historyJson: state, winnerItemId },
    });
    publish(list.id, { ok: true, event: 'state', state, winnerItemId });
    return withCORS(NextResponse.json({ ok: true, state, winnerItemId }), origin);
  } catch (e: any) {
    console.error('narrow/undo error', e);
    return withCORS(NextResponse.json({ ok: false, error: e?.message || 'Internal error' }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}