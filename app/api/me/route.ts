import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth.server";

export async function GET() {
  const session = await auth();
  return NextResponse.json({
    ok: true,
    user: session?.user ?? null,
  });
}
