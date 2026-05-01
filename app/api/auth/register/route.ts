import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getOrigin, preflight, withCORS } from "@/lib/cors";
import { createErrorResponse, validateOrigin } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().max(120).trim().optional(),
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    if (!validateOrigin(req)) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }),
        origin
      );
    }

    const rl = await rateLimit(req, { scope: "register", limit: 20, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Use a valid email and a password of at least 8 characters." }, { status: 400 }),
        origin
      );
    }

    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return withCORS(
        NextResponse.json({ ok: false, error: "An account with that email already exists." }, { status: 409 }),
        origin
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: hashPassword(password),
      },
      select: { id: true, email: true },
    });

    return withCORS(NextResponse.json({ ok: true, user }), origin);
  } catch (error) {
    return withCORS(createErrorResponse(error, 400, "Could not create account"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
