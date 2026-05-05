import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getOrigin, preflight, withCORS } from "@/lib/cors";
import { createErrorResponse, validateOrigin } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const registerSchema = z.object({
  firstName: z.string().min(1).max(60).trim(),
  lastName: z.string().min(1).max(60).trim(),
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
  confirmEmail: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
  acceptedTerms: z.literal(true),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Email addresses do not match.",
  path: ["confirmEmail"],
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
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
        NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Use valid account details." }, { status: 400 }),
        origin
      );
    }

    const { firstName, lastName, email, password } = parsed.data;
    const name = `${firstName} ${lastName}`;
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
