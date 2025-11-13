import { NextRequest, NextResponse } from "next/server";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  identifier?: string;
};

type RateLimitSuccess = { ok: true };
type RateLimitFailure = { ok: false; res: NextResponse };
export type RateLimitResult = RateLimitSuccess | RateLimitFailure;

type CounterInfo = { count: number; ttlMs: number };
type MemoryEntry = { count: number; expiresAt: number };

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const globalStoreKey = Symbol.for("choosie.rateLimit.store");
type GlobalWithStore = typeof globalThis & { [globalStoreKey]?: Map<string, MemoryEntry> };

const globalRef = globalThis as GlobalWithStore;
const memoryStore = globalRef[globalStoreKey] ?? new Map<string, MemoryEntry>();
if (!globalRef[globalStoreKey]) {
  globalRef[globalStoreKey] = memoryStore;
}

const REDIS_AVAILABLE = Boolean(redisUrl && redisToken);

const redisHeaders: HeadersInit | undefined = REDIS_AVAILABLE
  ? {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    }
  : undefined;

function sanitizeScope(scope: string): string {
  const trimmed = scope.trim();
  if (!trimmed) throw new Error("rateLimit scope is required");
  return trimmed.replace(/[^a-zA-Z0-9:_-]/g, "");
}

function deriveIdentifier(req: NextRequest, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const headerCandidates = [req.headers.get("cf-connecting-ip"), req.headers.get("x-real-ip")];
  for (const candidate of headerCandidates) {
    if (candidate?.trim()) return candidate.trim();
  }
  const requestIp = (req as any).ip;
  if (typeof requestIp === "string" && requestIp.trim()) return requestIp.trim();
  const ua = req.headers.get("user-agent");
  if (ua?.trim()) return `ua:${ua.trim().slice(0, 120)}`;
  return "global";
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value === "object" && "result" in (value as any)) {
    return parseNumber((value as any).result);
  }
  return null;
}

async function incrementRedisCounter(key: string, windowMs: number): Promise<CounterInfo | null> {
  if (!REDIS_AVAILABLE) return null;
  try {
    const pipelineRes = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: redisHeaders,
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, windowMs, "NX"],
        ["PTTL", key],
      ]),
      cache: "no-store",
    });

    if (!pipelineRes.ok) throw new Error(`Redis pipeline failed (${pipelineRes.status})`);
    const payload = await pipelineRes.json();
    if (!Array.isArray(payload) || payload.length < 3) {
      throw new Error("Unexpected Redis response shape");
    }

    const count = parseNumber(payload[0]);
    let ttlMs = parseNumber(payload[2]) ?? -1;

    if (count === null) throw new Error("Missing Redis INCR result");

    if (ttlMs < 0) ttlMs = windowMs;

    return { count, ttlMs };
  } catch (error) {
    console.warn("[rateLimit] Redis unavailable, falling back to memory store.", error);
    return null;
  }
}

function incrementMemoryCounter(key: string, windowMs: number): CounterInfo {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { count: 1, ttlMs: windowMs };
  }

  existing.count += 1;
  const ttlMs = Math.max(0, existing.expiresAt - now);
  return { count: existing.count, ttlMs };
}

function build429Response(limit: number, ttlMs: number, scope: string): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
  const resetEpochSeconds = Math.ceil((Date.now() + ttlMs) / 1000);
  return NextResponse.json(
    {
      ok: false,
      error: "Too many requests. Please slow down.",
      scope,
    },
    {
      status: 429,
      headers: {
        "Retry-After": `${retryAfterSeconds}`,
        "X-RateLimit-Limit": `${limit}`,
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": `${resetEpochSeconds}`,
      },
    }
  );
}

export async function rateLimit(req: NextRequest, options: RateLimitOptions): Promise<RateLimitResult> {
  const scope = sanitizeScope(options.scope);
  const identifier = deriveIdentifier(req, options.identifier);
  const key = `rl:${scope}:${identifier}`;

  const counter =
    (await incrementRedisCounter(key, options.windowMs)) ?? incrementMemoryCounter(key, options.windowMs);

  const remaining = options.limit - counter.count;
  if (remaining >= 0) {
    return { ok: true };
  }

  const res = build429Response(options.limit, counter.ttlMs, scope);
  return { ok: false, res };
}
