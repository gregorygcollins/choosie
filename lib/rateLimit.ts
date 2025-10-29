import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (best-effort; not durable across serverless invocations)
// Use only as a basic safeguard for MVP
const buckets = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  const ip = (xff ? xff.split(",")[0] : (req as any).ip) || "unknown";
  const ua = req.headers.get("user-agent") || "";
  return `${ip}|${ua.slice(0, 50)}`;
}

export function rateLimit(
  req: NextRequest,
  opts: { limit?: number; windowMs?: number; scope?: string } = {}
): { ok: true } | { ok: false; res: NextResponse } {
  const limit = opts.limit ?? 60; // requests
  const windowMs = opts.windowMs ?? 60_000; // 1 minute
  const scope = opts.scope ?? "global";

  const now = Date.now();
  const key = `${scope}:${getClientKey(req)}`;
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count < limit) {
    entry.count += 1;
    return { ok: true };
  }

  const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
  const res = new NextResponse(JSON.stringify({ ok: false, error: "Rate limit exceeded" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSec),
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.floor(entry.resetAt / 1000)),
    },
  });

  return { ok: false, res };
}
