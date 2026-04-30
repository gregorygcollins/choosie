"use client";

import { useParams } from "next/navigation";
import { NarrowingSession } from "@/components/NarrowingSession";

export default function NarrowPage() {
  const { id } = useParams<{ id: string }>();

  return <NarrowingSession listId={id} mode="in-person" />;
}
