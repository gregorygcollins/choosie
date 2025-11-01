import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";
import { getListById } from "@/lib/db";

export const runtime = "nodejs";

// Minimal curated catalog with tags for simple filtering/variety
const CATALOG: Array<{
  title: string;
  reason?: string;
  tags?: string[]; // cuisine, speed, diet, method
}> = [
  { title: "Taco night", reason: "Build-your-own and crowd-pleaser", tags: ["mexican", "quick"] },
  { title: "Stir-fry", reason: "Fast, flexible, great with veggies", tags: ["asian", "quick", "stovetop"] },
  { title: "Sheet-pan chicken", reason: "Easy, minimal cleanup", tags: ["american", "easy", "oven"] },
  { title: "Pasta al limone", reason: "Bright, simple, comforting", tags: ["italian", "pasta", "quick", "vegetarian"] },
  { title: "Burgers + oven fries", reason: "Weeknight classic", tags: ["american", "casual"] },
  { title: "Thai curry", reason: "Cozy and customizable heat", tags: ["thai", "stovetop", "gluten-free"] },
  { title: "Grain bowl", reason: "Healthy base with fun toppings", tags: ["healthy", "vegetarian", "gluten-free", "quick"] },
  { title: "Homemade pizza", reason: "Everyone picks a topping", tags: ["italian", "shareable"] },
  { title: "Chili", reason: "Make-ahead and feeds a crowd", tags: ["american", "stew", "make-ahead", "gluten-free"] },
  { title: "Fajitas", reason: "Sizzle factor, quick on the stove", tags: ["mexican", "quick", "stovetop"] },
  { title: "Ramen upgrade", reason: "Quick broth + add-ins", tags: ["japanese", "quick"] },
  { title: "Salmon + greens", reason: "Light and weeknight easy", tags: ["seafood", "healthy", "gluten-free"] },
  { title: "Shakshuka", reason: "Brunch-for-dinner energy", tags: ["mediterranean", "vegetarian", "stovetop"] },
  { title: "Baked ziti", reason: "Cheesy, comforting bake", tags: ["italian", "bake"] },
  { title: "Teriyaki chicken bowls", reason: "Savory-sweet favorite", tags: ["asian", "bowl"] },
  { title: "Tortellini soup", reason: "Cozy in one pot", tags: ["soup", "one-pot", "italian"] },
  { title: "Veggie quesadillas", reason: "Fast and kid-friendly", tags: ["mexican", "quick", "vegetarian"] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = rateLimit(req, { scope: "foodSuggestions", limit: 60, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit ?? 12), 1), 24);
    const listId = typeof body?.listId === "string" ? (body.listId as string) : undefined;
    const itemsFromBody: string[] = Array.isArray(body?.items)
      ? body.items
          .map((x: any) => (typeof x === "string" ? x : x?.title))
          .filter((x: any) => typeof x === "string" && x.trim())
      : [];

    // Collect existing titles to avoid duplicates
    const existingTitles = new Set<string>(itemsFromBody.map((t) => t.toLowerCase()));

    if (listId) {
      try {
        const list = await getListById(listId);
        if (list) {
          for (const it of list.items || []) {
            if (it?.title) existingTitles.add(String(it.title).toLowerCase());
          }
        }
      } catch {
        // ignore db errors; continue with body items only
      }
    }

    // Basic filtering by optional tags
    const wantTags = Array.isArray(body?.tags)
      ? (body.tags as string[]).map((t) => t.toLowerCase())
      : [];

    const pool = wantTags.length
      ? CATALOG.filter((c) => (c.tags || []).some((t) => wantTags.includes(t.toLowerCase())))
      : CATALOG;

    const out: any[] = [];
    for (const s of shuffle(pool)) {
      if (existingTitles.has(s.title.toLowerCase())) continue;
      out.push({ id: s.title, title: s.title, reason: s.reason });
      if (out.length >= limit) break;
    }

    const res = NextResponse.json({ ok: true, suggestions: out });
    return withCORS(res, origin);
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 400 });
    return withCORS(res, origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
