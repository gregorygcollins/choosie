import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { searchMovies } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = rateLimit(req, { scope: "movies-search", limit: 120, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim();
    if (!query) {
      const res = NextResponse.json({ ok: true, results: [] });
      return withCORS(res, origin);
    }

    const results = await searchMovies(query);
    const res = NextResponse.json({ ok: true, results });
    return withCORS(res, origin);
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Search failed" }, { status: 400 });
    return withCORS(res, origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
