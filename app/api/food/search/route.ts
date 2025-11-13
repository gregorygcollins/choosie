import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { searchRecipes } from "@/lib/spoonacular";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = await rateLimit(req, { scope: "food-search", limit: 120, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim();
    if (!query) {
      const res = NextResponse.json({ ok: true, recipes: [] });
      return withCORS(res, origin);
    }

    const recipes = await searchRecipes(query, 8);
    const res = NextResponse.json({ ok: true, recipes });
    return withCORS(res, origin);
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Search failed" }, { status: 400 });
    return withCORS(res, origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
