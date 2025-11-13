import { NextResponse } from "next/server";
import { searchTracks } from "@/lib/spotify";
import { rateLimit } from "@/lib/rateLimit";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Rate limit Spotify searches
  const rl = await rateLimit(request, { scope: "spotifySearch", limit: 60, windowMs: 60_000 });
  if (!rl.ok) return rl.res;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  // Validate query length
  if (query.length > 200) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  try {
    const tracks = await searchTracks(query);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Spotify search error:", error);
    return NextResponse.json({ error: "Failed to search tracks" }, { status: 500 });
  }
}
