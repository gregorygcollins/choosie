import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { narrowingConfirmRoundSchema, validateRequest } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
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
    const rl = rateLimit(req, { scope: 'narrowConfirm', limit: 200, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json();
    const data = validateRequest(narrowingConfirmRoundSchema, body);
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

    // Determine whose turn based on roundIndex maps to invitee index (0..participants-2)
    const activeIndex = state.roundIndex % (participants - 1);
    if (participantIndex !== activeIndex) {
      return withCORS(NextResponse.json({ ok: false, error: 'Not your round' }, { status: 409 }), origin);
    }

    const target = state.plan[state.roundIndex];
    const selected = state.current.selectedIds as string[];
    if (!Array.isArray(selected) || selected.length !== target) {
      return withCORS(NextResponse.json({ ok: false, error: 'Selection count does not match target' }, { status: 400 }), origin);
    }

    // Commit round
    const roundEntry = {
      round: state.roundIndex,
      role: invitees[activeIndex]?.role || null,
      participant: invitees[activeIndex]?.email || null,
      chosenIds: [...selected],
      prevRemaining: [...state.current.remainingIds],
    };
    state.rounds = Array.isArray(state.rounds) ? state.rounds : [];
    state.rounds.push(roundEntry);

    // Advance: new remaining = selectedIds; reset selectedIds; inc round
    state.current.remainingIds = [...selected];
    state.current.selectedIds = [];
    state.roundIndex += 1;

    let winnerItemId: string | null = null;
    const finished = state.roundIndex >= state.plan.length || state.current.remainingIds.length <= 1;
    if (finished) {
      const winner = state.current.remainingIds[0] || null;
      winnerItemId = winner;
    }

    await prisma.progress.upsert({
      where: { listId: list.id },
      update: { historyJson: state, winnerItemId },
      create: { listId: list.id, historyJson: state, winnerItemId },
    });

    publish(list.id, { ok: true, event: 'state', state, winnerItemId });
    return withCORS(NextResponse.json({ ok: true, state, winnerItemId }), origin);
  } catch (e: any) {
    console.error('narrow/confirm error', e);
    return withCORS(NextResponse.json({ ok: false, error: e?.message || 'Internal error' }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}