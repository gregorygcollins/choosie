import { NextResponse } from "next/server";
import { searchTracks } from "@/lib/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  try {
    const tracks = await searchTracks(query);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Spotify search error:", error);
    return NextResponse.json({ error: "Failed to search tracks" }, { status: 500 });
  }
}
