import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { narrowingDeselectSchema, validateRequest } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

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
  const history = (list.progress?.historyJson as any) || { rounds: [], current: { remainingIds: list.items.map((i: any) => i.id) } };
  return history;
}

function ensureSelectionSet(state: any) {
  if (!state.current) state.current = {}; 
  if (!Array.isArray(state.current.selectedIds)) state.current.selectedIds = [];
  if (!Array.isArray(state.current.remainingIds)) {
    state.current.remainingIds = [];
  }
  return state;
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = rateLimit(req, { scope: 'narrowDeselect', limit: 300, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json();
    const data = validateRequest(narrowingDeselectSchema, body);
    const list = await getList(data.listId);
    if (!list) {
      return withCORS(NextResponse.json({ ok: false, error: 'List not found' }, { status: 404 }), origin);
    }
    const invitees = extractInvitees(list);
    const participant = invitees.find((i: any) => i.token === data.participantToken);
    if (!participant) {
      return withCORS(NextResponse.json({ ok: false, error: 'Invalid participant token' }, { status: 403 }), origin);
    }
    const state = ensureSelectionSet(buildCanonical(list));
    const selected = state.current.selectedIds as string[];
    const idx = selected.indexOf(data.itemId);
    if (idx >= 0) selected.splice(idx, 1);

    await prisma.progress.upsert({
      where: { listId: list.id },
      update: { historyJson: state },
      create: { listId: list.id, historyJson: state },
    });
    return withCORS(NextResponse.json({ ok: true, state }), origin);
  } catch (e: any) {
    console.error('narrow/deselect error', e);
    return withCORS(NextResponse.json({ ok: false, error: e?.message || 'Internal error' }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}