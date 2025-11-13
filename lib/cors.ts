import { NextRequest, NextResponse } from "next/server";
import { listAllowedOrigins } from "./env";

// Compute caller origin but prefer the actual request URL origin rather than '*' to avoid wildcarding.
export function getOrigin(req: NextRequest): string {
  return req.headers.get("origin") || req.nextUrl.origin;
}

function isAllowedOrigin(origin: string | null | undefined): string | null {
  if (!origin) return null;
  try {
    const o = new URL(origin).origin;
    const allowed = listAllowedOrigins();
    return allowed.includes(o) ? o : null;
  } catch {
    // Not a valid URL; reject
    return null;
  }
}

export function withCORS(res: NextResponse, origin: string) {
  const allowed = isAllowedOrigin(origin) || null;
  if (allowed) {
    res.headers.set("Access-Control-Allow-Origin", allowed);
  }
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return res;
}

export function preflight(origin: string) {
  const res = new NextResponse(null, { status: 204 });
  const allowed = isAllowedOrigin(origin) || null;
  if (allowed) {
    res.headers.set("Access-Control-Allow-Origin", allowed);
  }
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}
