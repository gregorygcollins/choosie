import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { validateOrigin, createErrorResponse, requireAuth } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    if (!validateOrigin(req)) {
      return withCORS(NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }), origin);
    }

    const body = await req.json().catch(() => ({}));
    const listId = typeof body?.listId === "string" ? body.listId : "";
    if (!listId) {
      return withCORS(NextResponse.json({ ok: false, error: "Missing listId" }, { status: 400 }), origin);
    }

    const session = await auth();
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        items: { orderBy: { rank: "asc" } },
        progress: true,
        narrowingSessions: { orderBy: { completedAt: "desc" } },
      },
    });
    if (!list) return withCORS(NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }), origin);

    const authCheck = requireAuth(session, list.userId);
    if (!authCheck.ok) return withCORS(authCheck.response, origin);

    const user = await prisma.user.findUnique({ where: { id: list.userId }, select: { isPro: true } });
    if (!user?.isPro) {
      return withCORS(NextResponse.json({ ok: false, error: "Pro required" }, { status: 402 }), origin);
    }

    const itemMap = new Map(list.items.map((item) => [item.id, item.title]));
    const sessions = (list.narrowingSessions as any[]).map((entry) => normalizeSession(entry, itemMap));
    if (sessions.length === 0 && list.progress?.winnerItemId) {
      sessions.push(
        normalizeSession(
          {
            id: `current-${list.progress.id}`,
            mode: null,
            completedAt: list.progress.updatedAt,
            winnerItemId: list.progress.winnerItemId,
            startingItemCount: list.items.length,
            roundsJson: {
              plan: (list.progress.historyJson as any)?.plan,
              rounds: (list.progress.historyJson as any)?.rounds,
              itemSnapshot: list.items.map((item) => ({ id: item.id, title: item.title })),
            },
          },
          itemMap,
        ),
      );
    }

    return withCORS(NextResponse.json({ ok: true, sessions }), origin);
  } catch (error: any) {
    return withCORS(createErrorResponse(error, 400, "Failed to load list log"), origin);
  }
}

function normalizeSession(entry: any, fallbackTitleMap: Map<string, string>) {
  const roundsJson = entry.roundsJson || {};
  const snapshot = Array.isArray(roundsJson.itemSnapshot) ? roundsJson.itemSnapshot : [];
  const titleMap = new Map<string, string>(fallbackTitleMap);
  snapshot.forEach((item: any) => {
    if (item?.id && item?.title) titleMap.set(item.id, item.title);
  });

  const rounds = Array.isArray(roundsJson.rounds)
    ? roundsJson.rounds.map((round: any, index: number) => {
        const prevRemaining = Array.isArray(round.prevRemaining) ? round.prevRemaining : [];
        const chosenIds = Array.isArray(round.chosenIds) ? round.chosenIds : [];
        const removedIds = prevRemaining.filter((id: string) => !chosenIds.includes(id));
        return {
          round: index + 1,
          from: prevRemaining.length,
          to: chosenIds.length,
          kept: chosenIds.map((id: string) => ({ id, title: titleMap.get(id) || "Untitled" })),
          removed: removedIds.map((id: string) => ({ id, title: titleMap.get(id) || "Untitled" })),
        };
      })
    : [];

  return {
    id: entry.id,
    mode: entry.mode,
    completedAt: entry.completedAt instanceof Date ? entry.completedAt.toISOString() : entry.completedAt,
    winner: entry.winnerItemId
      ? { id: entry.winnerItemId, title: titleMap.get(entry.winnerItemId) || "Untitled" }
      : null,
    startingItemCount: entry.startingItemCount,
    path: [entry.startingItemCount, ...rounds.map((round: any) => round.to)].filter((count) => Number.isFinite(count)),
    rounds,
  };
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
