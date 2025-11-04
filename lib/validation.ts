import { z } from "zod";

// Validation schemas for API inputs

export const createListSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  // Accept either `module` or `moduleType` from clients; map later in route
  module: z.enum(["movies", "books", "food", "anything", "music"]).optional(),
  moduleType: z.enum(["movies", "books", "food", "anything", "music"]).optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(500).trim(),
        notes: z.string().max(1000).optional(),
        image: z.string().url().nullable().optional(),
        tmdbId: z.string().max(50).optional(),
      })
    )
    .max(100) // Reasonable limit on items per list
    .optional(),
});

export const addMovieSchema = z.object({
  listId: z.string().min(1).max(50),
  title: z.string().min(1).max(500).trim(),
  notes: z.string().max(1000).optional(),
});

export const getListSchema = z.object({
  listId: z.string().min(1).max(50),
});

export const finalizeWatchlistSchema = z.object({
  listId: z.string().min(1).max(50),
  winnerId: z.string().min(1).max(50).optional(),
  history: z.any().optional(), // JSON payload, validate structure if needed
});

export const getOverlapSchema = z.object({
  listId: z.string().min(1).max(50),
  userIds: z.array(z.string().min(1).max(50)).min(1).max(10),
});

export const getSuggestionsSchema = z.object({
  listId: z.string().min(1).max(50),
  context: z.string().max(2000).optional(),
});

/**
 * Safely parse and validate request body.
 * Returns parsed data or throws with a user-friendly message.
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    throw new Error(
      `Validation failed: ${firstError.path.join(".")} - ${firstError.message}`
    );
  }
  return result.data;
}
