"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NarrowingSession } from "@/components/NarrowingSession";

export default function VirtualNarrowPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const participantParam = searchParams.get("pt") ?? "0";
  const participantIndex = Number(participantParam);
  const isOrganizer = participantParam === "organizer";

  return (
    <NarrowingSession
      listId={id}
      mode="virtual"
      participantIndex={isOrganizer ? null : Number.isFinite(participantIndex) ? participantIndex : 0}
      viewerRole={isOrganizer ? "Organizer" : undefined}
    />
  );
}
