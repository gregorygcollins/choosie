import { NextRequest, NextResponse } from "next/server";
import { getListById } from "@/lib/db";
import { discoverMovies, trendingMovies } from "@/lib/tmdb";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const GENRE_NAME_TO_ID: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Sci-Fi": 878,
  "Science Fiction": 878,
  TV: 10770,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

function eraToDates(era?: string): { gte?: string; lte?: string } {
  switch (era) {
    case "classic":
      return { lte: "1979-12-31" };
    case "80s90s":
      return { gte: "1980-01-01", lte: "1999-12-31" };
    case "2000s":
      return { gte: "2000-01-01", lte: "2009-12-31" };
    case "2010s":
      return { gte: "2010-01-01", lte: "2019-12-31" };
    case "2020s":
      return { gte: "2020-01-01" };
    default:
      return {};
  }
}

function moodBoostGenres(mood?: string): string[] {
  switch (mood) {
    case "cozy":
      return ["Family", "Comedy", "Romance"];
    case "feelgood":
      return ["Romance", "Comedy", "Drama"];
    case "chill":
      return ["Drama", "Romance"];
    case "hype":
      return ["Action", "Adventure", "Sci-Fi"];
    case "dark":
      return ["Thriller", "Horror"];
    default:
      return [];
  }
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = await rateLimit(req, { scope: "getSuggestions", limit: 60, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json();
    const listId = body?.listId as string | undefined;
    const clientItems: string[] | undefined = Array.isArray(body?.items) ? body.items.map((s: any) => String(s)).filter(Boolean) : undefined;
    const limit = Math.min(Math.max(Number(body?.limit ?? 12), 1), 24);

    // Load server list when available; otherwise operate on client-provided items to enable suggestions for local lists
    let list = null as Awaited<ReturnType<typeof getListById>> | null;
    if (listId) {
      list = await getListById(listId);
    }
    if (!list && !clientItems) {
      const res = NextResponse.json({ ok: false, error: "Provide listId or items[]" }, { status: 400 });
      return withCORS(res, origin);
    }

  // Build discover params from preferences (if present). If preferences were removed, fall back to empty.
  const prefs = (list as any)?.preferences || (body?.preferences || {}) as any;
    const boosted = new Set([...(prefs.genres || []), ...moodBoostGenres(prefs.mood)]);
    const genreIds = Array.from(boosted)
      .map((g) => GENRE_NAME_TO_ID[g] || null)
      .filter(Boolean) as number[];

    const era = eraToDates(prefs.era);
    const params: any = {
      sort_by: "popularity.desc",
    };
    if (genreIds.length) params.with_genres = genreIds.join(",");
    if (prefs.minRating) params["vote_average.gte"] = prefs.minRating;
    if (era.gte) params["primary_release_date.gte"] = era.gte;
    if (era.lte) params["primary_release_date.lte"] = era.lte;

    let results = [] as any[];
    try {
      results = await discoverMovies(params);
    } catch (e) {
      // fallback
      results = await trendingMovies();
    }

    // Deduplicate and exclude already-added by case-insensitive title match
    const existing = new Set(
      (list?.items || []).map((i) => i.title.toLowerCase()).concat(
        (clientItems || []).map((t) => t.toLowerCase())
      )
    );
    const out: any[] = [];
    for (const r of results) {
      if (existing.has((r.title || "").toLowerCase())) continue;
      out.push({
        id: r.id,
        title: r.title,
        image: r.poster,
        year: r.year,
        reason: prefs.mood ? `Fits your ${prefs.mood} vibe` : "Popular now",
        score: r.vote || 0,
      });
      if (out.length >= limit) break;
    }

    const res = NextResponse.json({ ok: true, suggestions: out });
    return withCORS(res, origin);
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 400 });
    return withCORS(res, origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
