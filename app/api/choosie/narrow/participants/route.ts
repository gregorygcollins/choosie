import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// GET: Fetch participants for a narrowing session
export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("listId");
    const sessionId = searchParams.get("sessionId");
    if (!listId) return withCORS(NextResponse.json({ ok: false, error: "Missing listId" }, { status: 400 }), origin);
    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) return withCORS(NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }), origin);
    const tasteJson: any = list.tasteJson || {};
    const participants = Array.isArray(tasteJson.participantClaims)
      ? tasteJson.participantClaims
      : Array.isArray(tasteJson.participants)
      ? tasteJson.participants
      : [];
    const scopedParticipants = sessionId
      ? participants.filter((p: any) => p.sessionId === sessionId)
      : participants;
    return withCORS(NextResponse.json({ ok: true, participants: scopedParticipants }), origin);
  } catch (e: any) {
    return withCORS(NextResponse.json({ ok: false, error: e?.message || "Internal error" }, { status: 500 }), origin);
  }
}

// POST: Add or update a participant in a narrowing session
export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = await rateLimit(req, { scope: 'narrowParticipants', limit: 100, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);
    const body = await req.json();
    const { listId, name, role, sessionId } = body;
    if (!listId || !name || !role) return withCORS(NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 }), origin);
    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) return withCORS(NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }), origin);
    const tasteJson: any = list.tasteJson || {};
    const participants = Array.isArray(tasteJson.participantClaims)
      ? tasteJson.participantClaims
      : Array.isArray(tasteJson.participants)
      ? tasteJson.participants
      : [];
    // Prevent duplicate names/roles
    const matchingSession = (p: any) => sessionId ? p.sessionId === sessionId : !p.sessionId;
    if (participants.some((p: any) => matchingSession(p) && (p.name === name || p.role === role))) {
      return withCORS(NextResponse.json({ ok: false, error: "Name or role already taken" }, { status: 409 }), origin);
    }
    participants.push({ name, role, joined: true, sessionId });
    tasteJson.participantClaims = participants;
    await prisma.list.update({ where: { id: listId }, data: { tasteJson } });
    return withCORS(NextResponse.json({ ok: true, participants }), origin);
  } catch (e: any) {
    return withCORS(NextResponse.json({ ok: false, error: e?.message || "Internal error" }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
