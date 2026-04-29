import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { narrowingConfirmRoundSchema, validateRequest } from "@/lib/validation";
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
    const rl = await rateLimit(req, { scope: 'narrowConfirm', limit: 200, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json();
    console.log('[narrow/confirm] Incoming body:', body);
    const data = validateRequest(narrowingConfirmRoundSchema, body);
    const list = await getList(data.listId);
    if (!list) {
      console.log('[narrow/confirm] List not found:', data.listId);
      return withCORS(NextResponse.json({ ok: false, error: 'List not found' }, { status: 404 }), origin);
    }
    const invitees = extractInvitees(list);
    // TEMP: Bypass participantToken validation
    // const participantIndex = invitees.findIndex((i: any) => i.token === data.participantToken);
    // if (participantIndex < 0) {
    //   return withCORS(NextResponse.json({ ok: false, error: 'Invalid participant token' }, { status: 403 }), origin);
    // }

    const participants = (list as any).tasteJson?.participants || (invitees.length + 1) || 2;
    const plan = computeNarrowingPlan(list.items.length, participants, { participants });
    const state = buildCanonical(list);
    if (!state.plan) state.plan = plan;

    // TEMP: Always allow action as single participant
    // const activeIndex = state.roundIndex % (participants - 1);
    // if (participantIndex !== activeIndex) {
    //   return withCORS(NextResponse.json({ ok: false, error: 'Not your round' }, { status: 409 }), origin);
    // }

    const target = state.plan[state.roundIndex];
    const selected = state.current.selectedIds as string[];
    if (!Array.isArray(selected) || selected.length !== target) {
      console.log('[narrow/confirm] Selection count mismatch:', { selected, target });
      return withCORS(NextResponse.json({ ok: false, error: 'Selection count does not match target' }, { status: 400 }), origin);
    }

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
    // Commit round
    console.log('[narrow/confirm] BEFORE', {
      listId: data.listId,
      participantToken: data.participantToken,
      roundIndex: state.roundIndex,
      selectedIds: state.current.selectedIds,
      remainingIds: state.current.remainingIds,
      plan: state.plan,
      finished,
      winnerItemId,
    });
    // No activeIndex in no-token mode; set role/participant to null or default
    const roundEntry = {
      round: state.roundIndex,
      role: null, // or e.g. `"Virtual"` or `"N/A"`
      participant: "Virtual participant",
      chosenIds: [...selected],
      prevRemaining: [...state.current.remainingIds],
    };
    state.rounds = Array.isArray(state.rounds) ? state.rounds : [];
    state.rounds.push(roundEntry);
    // Debug log
    console.log('[narrow/confirm] FINALIZE', {
      listId: data.listId,
      selectedIds: selected,
      target: state.current.target,
      roundIndex: state.roundIndex,
      plan: state.plan,
      winnerItemId,
    });

    await prisma.progress.upsert({
      where: { listId: list.id },
      update: { historyJson: state, winnerItemId },
      create: { listId: list.id, historyJson: state, winnerItemId },
    });
    console.log('[narrow/confirm] UPSERT', {
      listId: list.id,
      winnerItemId,
      roundIndex: state.roundIndex,
      remainingIds: state.current.remainingIds,
      selectedIds: state.current.selectedIds,
      plan: state.plan,
      finished,
      state,
    });

    console.log('[narrow/confirm] AFTER', {
      listId: data.listId,
      participantToken: data.participantToken,
      roundIndex: state.roundIndex,
      selectedIds: state.current.selectedIds,
      remainingIds: state.current.remainingIds,
      winnerItemId,
      state,
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