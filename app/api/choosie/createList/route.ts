import { NextRequest, NextResponse } from "next/server";
import { createList } from "@/lib/db";
import { searchMovies } from "@/lib/tmdb";
import type { ModuleType } from "@prisma/client";
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
    // Normalize module string to Prisma enum
    const clientModule = (validatedData as any).module || (validatedData as any).moduleType;
    const moduleMap: Record<string, ModuleType> = {
      movies: "MOVIES",
      books: "BOOKS",
      food: "RECIPES",
      anything: "ANYTHING",
      // No MUSIC in Prisma schema; store as ANYTHING for now
      music: "ANYTHING",
    } as const;
    const moduleEnum: ModuleType = clientModule && moduleMap[String(clientModule)]
      ? moduleMap[String(clientModule)]
      : "MOVIES";
    
    const session = await auth();
    const userId = session?.user?.id || "dev-user-temp"; // fallback for anonymous/dev
    
    // Optionally enrich movie items with posters on the server to ensure artwork persists
    let items = validatedData.items as Array<{ title: string; notes?: string; image?: string | null }> | undefined;
    if (moduleEnum === "MOVIES" && Array.isArray(items) && items.length) {
      const enriched: typeof items = [];
      for (const it of items) {
        if (it.image) {
          enriched.push(it);
          continue;
        }
        try {
          const results = await searchMovies(it.title);
          const poster = results?.[0]?.poster || null;
          enriched.push({ ...it, image: poster });
        } catch {
          enriched.push(it);
        }
      }
      items = enriched;
    }

    const list = await createList(
      userId,
      validatedData.title,
      items,
      moduleEnum
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
          image: it.imageUrl || null,
        })),
        createdAt: list.createdAt.toISOString(),
        // Echo a friendly moduleType for client UI
        moduleType: list.module === "BOOKS" ? "books"
          : list.module === "RECIPES" ? "food"
          : list.module === "ANYTHING" ? (clientModule === "music" ? "music" : "anything")
          : "movies",
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
