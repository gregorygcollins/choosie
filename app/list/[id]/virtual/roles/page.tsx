import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { RoleSelectionClient } from "./RoleSelectionClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.choosietogether.com")
  ).replace(/\/$/, "");
}

async function getInviteList(listId: string) {
  return prisma.list.findUnique({
    where: { id: listId },
    include: {
      items: {
        orderBy: { rank: "asc" },
        take: 6,
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const base = siteUrl();
  const list = await getInviteList(id).catch(() => null);
  const title = list?.title || "Choosie list";
  const description = "Turn reluctant agreement into passionate overlap!";
  const imageParams = new URLSearchParams({ title });
  for (const item of list?.items || []) {
    if (item.imageUrl) imageParams.append("poster", item.imageUrl);
  }
  const imageUrl = `${base}/api/og/virtual-invite?${imageParams.toString()}`;
  const pageUrl = `${base}/list/${id}/virtual/roles`;

  return {
    title: `You’re invited to Choosie: ${title}`,
    description,
    openGraph: {
      title: `You’re invited to Choosie: ${title}`,
      description,
      url: pageUrl,
      siteName: "Choosie",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} Choosie invite`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `You’re invited to Choosie: ${title}`,
      description,
      images: [imageUrl],
    },
  };
}

export default function RoleSelectionPage() {
  return <RoleSelectionClient />;
}
