import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

function validateToken(token: string): { valid: boolean; expired: boolean } {
  if (!token || typeof token !== 'string') return { valid: false, expired: false };
  const parts = token.split('.');
  if (parts.length !== 2) {
    // Legacy token without timestamp; allow for backwards compatibility
    return { valid: true, expired: false };
  }
  const [tokenPart, issuedAtStr] = parts;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) return { valid: false, expired: false };
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const expired = (now - issuedAt) > sevenDays;
  return { valid: true, expired };
}

// Public list fetch via participant token OR share token (future)
// Body: { listId: string, token?: string }

async function findList(listId: string) {
  return prisma.list.findUnique({
    where: { id: listId },
    include: {
      items: { orderBy: { rank: "asc" } },
      progress: true,
    },
  });
}

function mapModule(module: any, tasteJson: any): string {
  if (module === "BOOKS") return "books";
  if (module === "RECIPES") return "food";
  if (module === "ANYTHING") {
    if (tasteJson?.module === "music") return "music";
    return "anything";
  }
  return "movies";
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = await rateLimit(req, { scope: "publicGetList", limit: 120, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json();
    const listId = body?.listId as string;
    const token = body?.token as string | undefined;
    if (!listId) {
      return withCORS(NextResponse.json({ ok: false, error: "Missing listId" }, { status: 400 }), origin);
    }

    const list = await findList(listId);
    if (!list) {
      return withCORS(NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }), origin);
    }

    // Extract invitees snapshot from tasteJson (client stores event.invitees when preparing invites)
    const tasteJson: any = list.tasteJson || {};
    const invitees = Array.isArray(tasteJson.event?.invitees) ? tasteJson.event.invitees : [];

    let matched: any = null;
    if (token && invitees.length) {
      for (const inv of invitees) {
        if (typeof inv !== 'string' && inv.token && inv.token === token) {
          // Validate token expiry
          const validation = validateToken(inv.token);
          if (!validation.valid || validation.expired) {
            return withCORS(NextResponse.json({ ok: false, error: validation.expired ? 'Token expired' : 'Invalid token' }, { status: 403 }), origin);
          }
          matched = inv;
          break;
        }
      }
    }

    const payload = {
      id: list.id,
      title: list.title,
      moduleType: mapModule(list.module, tasteJson),
      items: list.items.map((it: any) => ({ id: it.id, title: it.title, notes: it.notes, image: it.imageUrl || null })),
      winnerItemId: list.progress?.winnerItemId || null,
      participantRole: matched?.role || null,
    };

    return withCORS(NextResponse.json({ ok: true, list: payload }), origin);
  } catch (e: any) {
    console.error("public getList error", e);
    return withCORS(NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 }), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
