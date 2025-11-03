// Spoonacular API integration for recipe suggestions
// Docs: https://spoonacular.com/food-api/docs

export type RecipeSuggestion = {
  id: number;
  title: string;
  image?: string | null;
};

function getKey(): string {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) throw new Error("Spoonacular API key missing");
  return key;
}

/**
 * Get popular recipes optionally filtered by cuisine tags.
 * Falls back to general popularity when no tags provided.
 */
export async function getPopularRecipes({ tags = [], limit = 12 }: { tags?: string[]; limit?: number }): Promise<RecipeSuggestion[]> {
  const key = getKey();
  const n = Math.min(Math.max(limit || 12, 1), 24);
  const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
  url.searchParams.set("apiKey", key);
  url.searchParams.set("number", String(n));
  url.searchParams.set("sort", "popularity");
  url.searchParams.set("addRecipeInformation", "false");
  if (tags.length) {
    // Use cuisine as a rough mapping for tags like italian, mexican, thai, etc.
    url.searchParams.set("cuisine", tags.join(","));
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Spoonacular request failed: ${res.status}`);
  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map((r: any) => ({ id: r.id, title: r.title, image: r.image || null }));
}
