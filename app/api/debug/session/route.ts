import { NextResponse } from "next/server";

// This debug endpoint has been disabled.
export async function GET() {
  return NextResponse.json({ ok: false, disabled: true }, { status: 404 });
}
