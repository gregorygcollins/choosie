import { NextRequest, NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const inMemoryBuckets = new Map<string, RateLimitBucket>();

const redisConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "") ?? null,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? null,
};

function getClientKey(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  const ip = (xff ? xff.split(",")[0] : (req as any).ip) || "unknown";
  const ua = req.headers.get("user-agent") || "";
  return `${ip}|${ua.slice(0, 50)}`;
}

async function incrementRedisCounter(key: string, windowMs: number): Promise<RateLimitBucket | null> {
  if (!redisConfig.url || !redisConfig.token) return null;
  const ttlSeconds = Math.ceil(windowMs / 1000);
  try {
    const endpoint = `${redisConfig.url}/pipeline`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${redisConfig.token}`,
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, ttlSeconds, "NX"],
        ["PTTL", key],
      ]),
    });

    if (!response.ok) {
      console.error("Redis rate limit error", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as { result?: [number, unknown, number] };
    const count = Number(data.result?.[0] ?? 0);
    const ttlRaw = data.result?.[2];
    const ttl = typeof ttlRaw === "number" && ttlRaw >= 0 ? ttlRaw : windowMs;
    return { count, resetAt: Date.now() + ttl };
  } catch (error) {
    console.error("Redis rate limit error", error);
    return null;
  }
}

function incrementMemoryCounter(key: string, windowMs: number): RateLimitBucket {
  const now = Date.now();
  const entry = inMemoryBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    const bucket = { count: 1, resetAt: now + windowMs };
    inMemoryBuckets.set(key, bucket);
    return bucket;
  }
  entry.count += 1;
  return entry;
}

export async function rateLimit(
  req: NextRequest,
  opts: { limit?: number; windowMs?: number; scope?: string } = {}
): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const limit = opts.limit ?? 60; // requests
  const windowMs = opts.windowMs ?? 60_000; // 1 minute
  const scope = opts.scope ?? "global";
  const key = `${scope}:${getClientKey(req)}`;

  const bucket =
    (await incrementRedisCounter(key, windowMs)) ??
    incrementMemoryCounter(key, windowMs);

  if (bucket.count <= limit) {
    return { ok: true };
  }

  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000));
  const res = new NextResponse(JSON.stringify({ ok: false, error: "Rate limit exceeded" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSec),
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.floor(bucket.resetAt / 1000)),
    },
  });

  return { ok: false, res };
}
