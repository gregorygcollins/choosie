import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { narrowingSelectSchema, validateRequest } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/sse";
import { computeNarrowingPlan } from "@/lib/planner";

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
  // Flatten to minimal canonical narrowing state; historyJson already stored in progress
  const history = (list.progress?.historyJson as any) || { rounds: [], current: { remainingIds: list.items.map((i: any) => i.id) } };
  return history;
}

function ensureSelectionSet(state: any) {
  if (!state.current) state.current = {}; 
  if (!Array.isArray(state.current.selectedIds)) state.current.selectedIds = [];
  if (!Array.isArray(state.current.remainingIds)) {
    // derive remaining from union of items minus previous rounds eliminations
    state.current.remainingIds = [];
  }
  return state;
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = rateLimit(req, { scope: 'narrowSelect', limit: 300, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json();
    const data = validateRequest(narrowingSelectSchema, body);
    const list = await getList(data.listId);
    if (!list) {
      return withCORS(NextResponse.json({ ok: false, error: 'List not found' }, { status: 404 }), origin);
    }

    const invitees = extractInvitees(list);
    const participant = invitees.find((i: any) => i.token === data.participantToken);
    if (!participant) {
      return withCORS(NextResponse.json({ ok: false, error: 'Invalid participant token' }, { status: 403 }), origin);
    }

    // Load canonical state
    const historyState = buildCanonical(list);
    ensureSelectionSet(historyState);

    // Basic rule: item must be in remainingIds and not already selected
    const remaining = historyState.current.remainingIds as string[];
    if (!remaining.includes(data.itemId)) {
      return withCORS(NextResponse.json({ ok: false, error: 'Item not in remaining set' }, { status: 400 }), origin);
    }
    const selected = historyState.current.selectedIds as string[];

    // Turn enforcement: only active participant may modify selection
    const tj: any = list.tasteJson || {};
    const participants = tj.participants || (invitees.length + 1) || 2;
    historyState.plan = Array.isArray(historyState.plan) ? historyState.plan : computeNarrowingPlan(list.items.length, participants, { participants });
    const activeIndex = (historyState.roundIndex || 0) % (participants - 1);
    const participantIndex = invitees.findIndex((i: any) => i.token === data.participantToken);
    if (participantIndex !== activeIndex) {
      return withCORS(NextResponse.json({ ok: false, error: 'Out of turn' }, { status: 409 }), origin);
    }
    if (selected.includes(data.itemId)) {
      return withCORS(NextResponse.json({ ok: true, state: historyState }), origin); // idempotent
    }
    selected.push(data.itemId);

    // Persist back
    await prisma.progress.upsert({
      where: { listId: list.id },
      update: { historyJson: historyState },
      create: { listId: list.id, historyJson: historyState },
    });

    publish(list.id, { ok: true, event: 'state', state: historyState, winnerItemId: list.progress?.winnerItemId || null });

    return withCORS(NextResponse.json({ ok: true, state: historyState }), origin);
  } catch (e: any) {
    console.error('narrow/select error', e);
    return withCORS(NextResponse.json({ ok: false, error: e?.message || 'Internal error' }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}