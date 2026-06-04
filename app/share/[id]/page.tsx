import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import SharedListClient from "./SharedListClient";

export const runtime = "nodejs";

type SharePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

function siteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.choosietogether.com")
  ).replace(/\/$/, "");
}

function getToken(searchParams: { token?: string | string[] }) {
  return Array.isArray(searchParams.token) ? searchParams.token[0] : searchParams.token;
}

function mapModuleLabel(module: unknown, tasteJson: any) {
  if (module === "BOOKS") return "Books";
  if (module === "RECIPES") return "Food";
  if (module === "MUSIC") return "Music";
  if (module === "ANYTHING") return tasteJson?.module === "music" ? "Music" : "Anything";
  return "Movies";
}

async function getSharedListForMetadata(listId: string, token?: string) {
  if (!listId || !token) return null;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      _count: { select: { items: true } },
      items: { orderBy: { rank: "asc" }, take: 4 },
    },
  });
  if (!list) return null;

  const tasteJson: any = list.tasteJson || {};
  const share = tasteJson.share || {};
  if (share.visibility !== "link" || typeof share.token !== "string" || share.token !== token) {
    return null;
  }

  return {
    title: list.title,
    description: list.description || "",
    moduleLabel: mapModuleLabel(list.module, tasteJson),
    itemCount: list._count.items,
    itemTitles: list.items.map((item) => item.title).filter(Boolean),
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const token = getToken(resolvedSearchParams);
  const sharedList = await getSharedListForMetadata(resolvedParams.id, token);
  const base = siteBaseUrl();

  if (!sharedList) {
    return {
      title: "Shared Choosie list",
      description: "Open this Choosie list.",
    };
  }

  const shareUrl = `${base}/share/${encodeURIComponent(resolvedParams.id)}?token=${encodeURIComponent(token || "")}`;
  const itemPreview = sharedList.itemTitles.slice(0, 3).join(", ");
  const description =
    sharedList.description ||
    `${sharedList.itemCount} ${sharedList.moduleLabel.toLowerCase()} ${sharedList.itemCount === 1 ? "item" : "items"}${itemPreview ? `: ${itemPreview}` : ""}`;
  const title = `${sharedList.title} | Choosie`;
  const imageParams = new URLSearchParams({
    title: sharedList.title,
    module: sharedList.moduleLabel,
    count: String(sharedList.itemCount),
  });
  if (itemPreview) imageParams.set("items", itemPreview);
  const imageUrl = `${base}/api/og/share-list?${imageParams.toString()}`;

  return {
    title,
    description,
    alternates: { canonical: shareUrl },
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: "Choosie",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${sharedList.title} on Choosie`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharedListPage({
  params,
  searchParams,
}: SharePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const token = getToken(resolvedSearchParams);
  return <SharedListClient listId={resolvedParams.id} token={token || ""} />;
}
