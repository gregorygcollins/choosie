import { NextRequest, NextResponse } from "next/server";
import { createList } from "@/lib/db";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { validateOrigin, createErrorResponse } from "@/lib/security";
import { validateRequest, createListSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    // Rate limiting
    const rl = rateLimit(req, { scope: "createList", limit: 30, windowMs: 60_000 });
    if (!rl.ok) {
      return withCORS(rl.res, origin);
    }

    // Origin validation for CSRF protection
    if (!validateOrigin(req)) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }),
        origin
      );
    }

    const body = await req.json();
    const validatedData = validateRequest(createListSchema, body);
    
    const session = await auth();
    const userId = session?.user?.id || "dev-user-temp"; // fallback for anonymous/dev
    
    const list = await createList(
      userId,
      validatedData.title,
      validatedData.items
    );
  
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
    return withCORS(createErrorResponse(e, 400, "Failed to create list"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
