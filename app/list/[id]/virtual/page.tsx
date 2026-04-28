"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
function VirtualInvitesPageContent() {
    const [state, setState] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
  const { id } = useParams();
  const router = useRouter();
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[NARROW DEBUG] route param id:', id);
  }

  // Defensive: check state shape
  const round = typeof state?.roundIndex === 'number' ? state.roundIndex : 0;
  const currentTarget = state?.current?.target ?? 1;
  const remainingItems = Array.isArray(state?.current?.remainingIds) ? items.filter((i) => state.current.remainingIds.includes(i.id)) : [];
  const selectedItems = Array.isArray(state?.current?.selectedIds) ? items.filter((i) => state.current.selectedIds.includes(i.id)) : [];

  // Get participant index from URL (?pt=)
  let participantIndex = 0;
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const pt = urlParams.get("pt");
    if (pt && !isNaN(Number(pt))) participantIndex = Number(pt);
  }

  // Selection state for this participant
  const [mySelections, setMySelections] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Handler for selecting/deselecting items
  const handleSelect = (itemId: string) => {
    setMySelections((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        if (prev.length < currentTarget) {
          return [...prev, itemId];
        } else {
          return prev; // do not exceed target
        }
      }
    });
  } // End handleSelect

  // ...existing code...
  return (
    <div>Virtual narrowing session page (placeholder)</div>
  );
}

export default function VirtualInvitesPage() {
  return (
    <ErrorBoundary>
      <VirtualInvitesPageContent />
    </ErrorBoundary>
  );
}
