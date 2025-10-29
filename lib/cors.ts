import { NextRequest, NextResponse } from "next/server";

export function getOrigin(req: NextRequest): string {
  return req.headers.get("origin") || "*";
}

export function withCORS(res: NextResponse, origin: string) {
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return res;
}

export function preflight(origin: string) {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}
