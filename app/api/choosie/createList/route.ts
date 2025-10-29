import { NextRequest, NextResponse } from "next/server";
import { createList } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // basic rate limiting
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const rl = rateLimit(req, { scope: "createList", limit: 30, windowMs: 60_000 });
    if (!rl.ok) {
      return withCORS(rl.res, origin);
    }
  const body = await req.json();
  const session = await auth();
  const userId = session?.user?.id || "dev-user-temp"; // fallback for anonymous/dev
    const title = (body?.title ?? "Untitled").toString();
    const items = Array.isArray(body?.items) ? body.items : undefined;
  const list = await createList(userId, title, items);
  
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const res = NextResponse.json({
      ok: true,
      listId: list.id,
      url: `${origin}${basePath}/list/${list.id}`,
      list: {
        id: list.id,
        title: list.title,
        items: list.items.map((it) => ({
          id: it.id,
          title: it.title,
          notes: it.notes,
          image: it.imageUrl,
        })),
        createdAt: list.createdAt.toISOString(),
      },
    });
    return withCORS(res, origin);
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 400 });
    return withCORS(res, getOrigin(req));
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
