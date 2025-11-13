import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "../../../../lib/googleBooks";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  try {
    // Rate limit book searches
    const rl = await rateLimit(req, { scope: "bookSearch", limit: 60, windowMs: 60_000 });
    if (!rl.ok) return rl.res;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    // Validate query length
    if (query.length > 200) {
      return NextResponse.json({ error: "Query too long" }, { status: 400 });
    }

    const books = await searchBooks(query);
    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error in /api/books/search:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 }
    );
  }
}
