import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/sse";
import { computeNarrowingPlan } from "@/lib/planner";
import { z } from "zod";

export const runtime = "nodejs";

const resetSchema = z.object({
  listId: z.string().min(1).max(50),
  participantToken: z.string().min(16).max(128).optional(),
});

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

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = rateLimit(req, { scope: 'narrowReset', limit: 30, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return withCORS(NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 }), origin);
    }
    const data = parsed.data;

    const list = await getList(data.listId);
    if (!list) {
      return withCORS(NextResponse.json({ ok: false, error: 'List not found' }, { status: 404 }), origin);
    }

    // Validate participant token if provided (optional: can allow organizer reset without token)
    if (data.participantToken) {
      const invitees = extractInvitees(list);
      const participant = invitees.find((i: any) => i.token === data.participantToken);
      if (!participant) {
        return withCORS(NextResponse.json({ ok: false, error: 'Invalid participant token' }, { status: 403 }), origin);
      }
    }

    // Reset progress to initial state
    const tj: any = list.tasteJson || {};
    const invitees = extractInvitees(list);
    const participants = tj.participants || (invitees.length + 1) || 2;
    const plan = computeNarrowingPlan(list.items.length, participants, { participants });
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

    await prisma.progress.upsert({
      where: { listId: list.id },
      update: { historyJson: initialState, winnerItemId: null },
      create: { listId: list.id, historyJson: initialState, winnerItemId: null },
    });

    publish(list.id, { ok: true, event: 'state', state: initialState, winnerItemId: null });
    return withCORS(NextResponse.json({ ok: true, state: initialState }), origin);
  } catch (e: any) {
    console.error('narrow/reset error', e);
    return withCORS(NextResponse.json({ ok: false, error: e?.message || 'Internal error' }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
