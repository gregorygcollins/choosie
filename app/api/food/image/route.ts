import { NextRequest, NextResponse } from "next/server";
import { getOrigin, withCORS, preflight } from "@/lib/cors";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Helper: fetch first suitable Wikimedia Commons image for a query
async function fetchCommonsImage(query: string): Promise<{ url?: string; attribution?: string; licenseUrl?: string } | null> {
  const q = (query || "").trim();
  if (!q) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: q,
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "600",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
  const res = await fetch(url, { headers: { "User-Agent": "Choosie/1.0 (meal-images)" } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  const pages = data?.query?.pages ? Object.values<any>(data.query.pages) : [];
  const allowedLicenses = new Set(["CC0", "Public domain", "Public Domain", "CC-BY", "CC BY", "CC-BY-SA", "CC BY-SA"]);

  for (const p of pages) {
    const info = Array.isArray(p?.imageinfo) ? p.imageinfo[0] : null;
    if (!info) continue;
    const mime: string | undefined = info?.mime;
    if (!mime || !mime.startsWith("image/")) continue;
    const url: string | undefined = info?.thumburl || info?.url;
    const meta = info?.extmetadata || {};
    const license: string | undefined = meta?.LicenseShortName?.value || meta?.License?.value;
    if (!url || !license) continue;
    // Prefer CC0 / Public Domain; allow CC-BY/CC-BY-SA with attribution
    if (allowedLicenses.has(license)) {
      const artist: string | undefined = meta?.Artist?.value || meta?.Credit?.value || meta?.AttributionRequired?.value;
      const cleanedArtist = artist ? artist.replace(/<[^>]*>/g, "").trim() : undefined;
      const licenseUrl: string | undefined = meta?.LicenseUrl?.value || meta?.LicenseUrl || undefined;
      return { url, attribution: cleanedArtist, licenseUrl };
    }
  }
  return null;
}

// Fallback: Wikipedia pageimages API (thumbnail) if Commons yields nothing
async function fetchWikipediaThumb(query: string): Promise<string | null> {
  const q = (query || "").trim();
  if (!q) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "600",
    generator: "search",
    gsrsearch: q,
    gsrlimit: "12",
  });
  const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
  const res = await fetch(url, { headers: { "User-Agent": "Choosie/1.0 (meal-images)" } });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  const pages = data?.query?.pages ? Object.values<any>(data.query.pages) : [];
  for (const p of pages) {
    const thumb: string | undefined = p?.thumbnail?.source;
    if (thumb) return thumb;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  try {
    const rl = await rateLimit(req, { scope: "food-image", limit: 120, windowMs: 60_000 });
    if (!rl.ok) return withCORS(rl.res, origin);

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q) {
      const res = NextResponse.json({ ok: true, image: null });
      return withCORS(res, origin);
    }

    let imageUrl: string | null = null;
    let attribution: string | undefined;
    let licenseUrl: string | undefined;

    const commons = await fetchCommonsImage(q);
    if (commons?.url) {
      imageUrl = commons.url;
      attribution = commons.attribution;
      licenseUrl = commons.licenseUrl;
    } else {
      // fallback to Wikipedia thumb (no attribution metadata returned here)
      imageUrl = await fetchWikipediaThumb(q);
    }

    const res = NextResponse.json({ ok: true, image: imageUrl, attribution, licenseUrl });
    return withCORS(res, origin);
  } catch (e: any) {
    const res = NextResponse.json({ ok: false, error: e?.message || "Lookup failed" }, { status: 400 });
    return withCORS(res, origin);
  }
}

export async function OPTIONS(req: NextRequest) {
  return preflight(getOrigin(req));
}
