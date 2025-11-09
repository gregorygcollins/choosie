import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth.server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { validateOrigin, createErrorResponse } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    // Rate limiting
    const rl = rateLimit(req, { scope: "updateList", limit: 60, windowMs: 60_000 });
    if (!rl.ok) {
      return withCORS(rl.res, origin);
    }

    // Origin validation for CSRF protection
    if (!validateOrigin(req)) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 }),
        origin
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
        origin
      );
    }

    const body = await req.json();
    const { listId, title, items, participants } = body;

    if (!listId) {
      return withCORS(
        NextResponse.json({ ok: false, error: "listId required" }, { status: 400 }),
        origin
      );
    }

    // Verify ownership
    const existingList = await prisma.list.findUnique({
      where: { id: listId },
      include: { items: true },
    });

    if (!existingList) {
      return withCORS(
        NextResponse.json({ ok: false, error: "List not found" }, { status: 404 }),
        origin
      );
    }

    if (existingList.userId !== session.user.id) {
      return withCORS(
        NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
        origin
      );
    }

    // Update list title if provided
    const updates: any = {};
    if (title !== undefined) {
      updates.title = title;
    }
    if (participants !== undefined) {
      // Store participants in tasteJson
      updates.tasteJson = {
        ...(existingList.tasteJson as any || {}),
        participants,
      };
    }

    // Update the list
    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: updates,
      include: { items: true },
    });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete items not in the new list
      const newItemIds = items.filter(it => it.id).map(it => it.id);
      const itemsToDelete = existingList.items.filter(
        item => !newItemIds.includes(item.id)
      );
      
      if (itemsToDelete.length > 0) {
        await prisma.item.deleteMany({
          where: {
            id: { in: itemsToDelete.map(it => it.id) },
          },
        });
      }

      // Update or create items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id && existingList.items.some(ei => ei.id === item.id)) {
          // Update existing item
          await prisma.item.update({
            where: { id: item.id },
            data: {
              title: item.title,
              notes: item.notes,
              imageUrl: item.image,
              rank: i,
            },
          });
        } else {
          // Create new item
          await prisma.item.create({
            data: {
              listId,
              title: item.title,
              notes: item.notes,
              imageUrl: item.image,
              rank: i,
            },
          });
        }
      }
    }

    // Fetch updated list with items
    const finalList = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        items: {
          orderBy: { rank: "asc" },
        },
      },
    });

    const res = NextResponse.json({
      ok: true,
      list: {
        id: finalList!.id,
        title: finalList!.title,
        items: finalList!.items.map((it) => ({
          id: it.id,
          title: it.title,
          notes: it.notes,
          image: it.imageUrl || null,
        })),
        createdAt: finalList!.createdAt.toISOString(),
        moduleType: finalList!.module === "BOOKS" ? "books"
          : finalList!.module === "RECIPES" ? "food"
          : finalList!.module === "ANYTHING" ? ((finalList!.tasteJson as any)?.module === "music" ? "music" : "anything")
          : "movies",
        participants: ((finalList!.tasteJson as any)?.participants),
      },
    });
    return withCORS(res, origin);
  } catch (e: any) {
    console.error("Update list error:", e);
    return withCORS(createErrorResponse(e, 500, "Failed to update list"), origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
