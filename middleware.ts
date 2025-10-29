import { NextResponse } from "next/server";

// Deprecated CORS middleware replaced by per-route handlers.
// Keep as a no-op to avoid Next.js middleware warnings during migration.
export function middleware() {
  return NextResponse.next();
}

export const config = { matcher: [] };
