import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "../../../../lib/googleBooks";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
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
