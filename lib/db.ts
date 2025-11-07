// Database layer for Choosie using Prisma
// Replaces JSON-based serverStore with Postgres-backed persistence
import { prisma } from "./prisma";
import type { List, Item, Progress, ModuleType } from "@prisma/client";

// Temporary dev user ID — replace with session userId after auth is wired
const DEV_USER_ID = "dev-user-temp";

// Ensure a dev user exists for testing
async function ensureDevUser() {
  const existing = await prisma.user.findUnique({ where: { id: DEV_USER_ID } });
  if (!existing) {
    await prisma.user.create({
      data: {
        id: DEV_USER_ID,
        email: "dev@choosie.local",
        name: "Dev User",
      },
    });
  }
}

export type ListWithItems = List & {
  items: Item[];
  progress?: Progress | null;
};

/**
 * Create a new list with optional initial items.
 * @param userId - The user who owns this list
 * @param title - List title
 * @param items - Optional array of initial items
 * @param module - Module type (default: MOVIES)
 */
export async function createList(
  userId: string,
  title: string,
  items?: Array<{ title: string; notes?: string; image?: string | null; tmdbId?: string }>,
  module: ModuleType = "MOVIES",
  metadata?: any,
): Promise<ListWithItems> {
  await ensureDevUser();
  const list = await prisma.list.create({
    data: {
      userId: userId || DEV_USER_ID,
      title: title.trim() || "Untitled",
      module,
      items: items
        ? {
            create: items.map((it) => ({
              title: it.title.trim(),
              notes: it.notes,
              imageUrl: it.image ?? undefined,
              tmdbId: it.tmdbId,
            })),
          }
        : undefined,
      // Store auxiliary info like original client module in tasteJson
      tasteJson: metadata ? metadata : undefined,
    },
    include: {
      items: true,
      progress: true,
    },
  });
  return list;
}

/**
 * Get a list by ID with all items and progress.
 */
export async function getListById(listId: string): Promise<ListWithItems | null> {
  return prisma.list.findUnique({
    where: { id: listId },
    include: {
      items: {
        orderBy: { rank: "asc" },
      },
      progress: true,
    },
  });
}

/**
 * Add a single item to an existing list (dedupe by title, case-insensitive).
 */
export async function addItemToList(
  listId: string,
  item: { title: string; notes?: string; image?: string | null; tmdbId?: string }
): Promise<Item | null> {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: { items: true },
  });
  if (!list) return null;

  // Check for duplicate by case-insensitive title
  const duplicate = list.items.find(
    (i) => i.title.toLowerCase() === item.title.trim().toLowerCase()
  );
  if (duplicate) return duplicate;

  const newItem = await prisma.item.create({
    data: {
      listId,
      title: item.title.trim(),
      notes: item.notes,
      imageUrl: item.image ?? undefined,
      tmdbId: item.tmdbId,
    },
  });
  return newItem;
}

/**
 * Update or create progress for a list (narrowing history).
 */
export async function upsertProgress(
  listId: string,
  historyJson: any,
  winnerItemId?: string
): Promise<Progress> {
  const existing = await prisma.progress.findUnique({
    where: { listId },
  });

  if (existing) {
    return prisma.progress.update({
      where: { listId },
      data: {
        historyJson,
        winnerItemId: winnerItemId ?? null,
      },
    });
  } else {
    return prisma.progress.create({
      data: {
        listId,
        historyJson,
        winnerItemId: winnerItemId ?? null,
      },
    });
  }
}

/**
 * Get all lists for a user (for /lists page).
 */
export async function getListsForUser(userId: string): Promise<ListWithItems[]> {
  return prisma.list.findMany({
    where: { userId: userId || DEV_USER_ID },
    include: {
      items: {
        orderBy: { rank: "asc" },
      },
      progress: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Delete a list and all its items/progress (cascade handled by Prisma schema).
 */
export async function deleteList(listId: string): Promise<boolean> {
  try {
    await prisma.list.delete({ where: { id: listId } });
    return true;
  } catch {
    return false;
  }
}
