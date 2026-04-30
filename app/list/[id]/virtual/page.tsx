"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NarrowingSession } from "@/components/NarrowingSession";

export default function VirtualNarrowPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const participantIndex = Number(searchParams.get("pt") ?? "0");

  return (
    <NarrowingSession
      listId={id}
      mode="virtual"
      participantIndex={Number.isFinite(participantIndex) ? participantIndex : 0}
    />
  );
}
