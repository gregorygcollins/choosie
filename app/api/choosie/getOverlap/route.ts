import { NextRequest, NextResponse } from "next/server";
import { getListById } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { computeNarrowingPlan } from "@/lib/planner";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const origin = getOrigin(req);
    const rl = rateLimit(req, { scope: "getOverlap", limit: 60, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);
  const body = await req.json();
  const session = await auth();
    const listId = body?.listId as string;
    const desiredCount = Number(body?.desiredCount ?? 3);
    if (!listId) {
      const res400 = NextResponse.json({ ok: false, error: "Missing listId" }, { status: 400 });
      return withCORS(res400, getOrigin(req));
    }
    const list = await getListById(listId);
    if (!list) {
      const res404 = NextResponse.json({ ok: false, error: "List not found" }, { status: 404 });
      return withCORS(res404, getOrigin(req));
    }
    if (session?.user?.id && list.userId !== session.user.id) {
      const res403 = NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      return withCORS(res403, getOrigin(req));
    }

    const items = list.items.map((it) => ({
      id: it.id,
      title: it.title,
      notes: it.notes,
      image: it.imageUrl,
    }));

    if (items.length <= desiredCount) {
      return NextResponse.json({ ok: true, suggestions: items, count: items.length });
    }

    // Use plan to determine a target step close to desiredCount
    const players = 4; // default narrowers
    const tail = [5, 3, 1];
    const plan = computeNarrowingPlan(items.length, players, { tail, minReductionFraction: 0.2 });
    const target = plan.find((n) => n <= desiredCount) ?? desiredCount;

    // Simple heuristic: pick first N items as the suggested overlap set (ChatGPT can then ask the user to choose)
    const suggestions = items.slice(0, Math.max(1, target));
    const res = NextResponse.json({ ok: true, suggestions, count: suggestions.length, plan });
    return withCORS(res, getOrigin(req));
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 400 });
    return withCORS(res, getOrigin(req));
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
