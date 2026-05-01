import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth.server";
import { getOrigin, preflight, withCORS } from "@/lib/cors";
import { createErrorResponse, requireAuth, validateOrigin } from "@/lib/security";
import { shareListSchema, validateRequest } from "@/lib/validation";

export const runtime = "nodejs";

function createShareToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function buildShareUrl(origin: string, listId: string, token: string) {
  const base = origin || process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${base}/share/${encodeURIComponent(listId)}?token=${encodeURIComponent(token)}`;
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    if (!validateOrigin(req)) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }),
        origin
      );
    }

    const body = await req.json();
    const { listId, action } = validateRequest(shareListSchema, body);

    const session = await auth();
    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
      return withCORS(
        NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }),
        origin
      );
    }

    const authCheck = requireAuth(session, list.userId);
    if (!authCheck.ok) return withCORS(authCheck.response, origin);

    const tasteJson: any = list.tasteJson && typeof list.tasteJson === "object" ? list.tasteJson : {};

    if (action === "disable") {
      const nextTasteJson = {
        ...tasteJson,
        share: {
          visibility: "private",
          disabledAt: new Date().toISOString(),
        },
      };
      await prisma.list.update({
        where: { id: listId },
        data: { tasteJson: nextTasteJson },
      });

      return withCORS(
        NextResponse.json({ ok: true, share: { visibility: "private" } }),
        origin
      );
    }

    const existingShare = tasteJson.share;
    const token =
      existingShare?.visibility === "link" && typeof existingShare?.token === "string"
        ? existingShare.token
        : createShareToken();

    const nextTasteJson = {
      ...tasteJson,
      share: {
        visibility: "link",
        token,
        createdAt: existingShare?.createdAt || new Date().toISOString(),
      },
    };

    await prisma.list.update({
      where: { id: listId },
      data: { tasteJson: nextTasteJson },
    });

    return withCORS(
      NextResponse.json({
        ok: true,
        share: {
          visibility: "link",
          url: buildShareUrl(origin, listId, token),
        },
      }),
      origin
    );
  } catch (error) {
    return withCORS(createErrorResponse(error, 400, "Failed to update sharing"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
