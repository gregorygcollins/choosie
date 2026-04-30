"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NarrowingPanel } from "@/components/NarrowingPanel";

type SessionMode = "in-person" | "virtual";

type ApiItem = {
  id: string;
  title: string;
  notes?: string | null;
  image?: string | null;
};

type NarrowingState = {
  plan: number[];
  roundIndex: number;
  current: {
    remainingIds: string[];
    selectedIds: string[];
    target: number;
  };
};

type NarrowingResponse = {
  ok: boolean;
  error?: string;
  state?: NarrowingState;
  winnerItemId?: string | null;
  items?: ApiItem[];
  participantCount?: number;
};

type NarrowingSessionProps = {
  listId: string;
  mode: SessionMode;
  participantIndex?: number;
};

function normalizeState(state: NarrowingState): NarrowingState {
  const roundIndex = Math.max(0, state.roundIndex || 0);
  const target = state.plan?.[roundIndex] ?? state.current?.target ?? 1;

  return {
    ...state,
    roundIndex,
    current: {
      remainingIds: Array.isArray(state.current?.remainingIds) ? state.current.remainingIds : [],
      selectedIds: Array.isArray(state.current?.selectedIds) ? state.current.selectedIds : [],
      target,
    },
  };
}

export function NarrowingSession({ listId, mode, participantIndex = 0 }: NarrowingSessionProps) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [state, setState] = useState<NarrowingState | null>(null);
  const [winnerItemId, setWinnerItemId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantToken = String(participantIndex);

  const loadState = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!listId) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/choosie/narrow/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
        cache: "no-store",
      });
      const json: NarrowingResponse = await res.json();
      if (!res.ok || !json.ok || !json.state || !json.items) {
        throw new Error(json.error || "Failed to load narrowing state");
      }

      setItems(json.items);
      setState(normalizeState(json.state));
      setWinnerItemId(json.winnerItemId || null);
      setParticipantCount(Math.max(1, json.participantCount || json.state.plan.length || 1));
    } catch (err: any) {
      setError(err?.message || "Failed to load narrowing state");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (mode !== "virtual") return;
    const interval = window.setInterval(() => {
      loadState({ silent: true });
    }, 2500);

    return () => window.clearInterval(interval);
  }, [loadState, mode]);

  const visibleItems = useMemo(() => {
    const remaining = new Set(state?.current.remainingIds || []);
    return items
      .filter((item) => remaining.has(item.id))
      .map((item) => ({
        id: item.id,
        name: item.title,
        notes: item.notes,
        image: item.image,
      }));
  }, [items, state]);

  async function postAction(endpoint: string, body: Record<string, string>) {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: NarrowingResponse = await res.json();
      if (!res.ok || !json.ok || !json.state) {
        throw new Error(json.error || "Narrowing action failed");
      }

      setState(normalizeState(json.state));
      if ("winnerItemId" in json) setWinnerItemId(json.winnerItemId || null);
    } catch (err: any) {
      setError(err?.message || "Narrowing action failed");
    } finally {
      setBusy(false);
    }
  }

  function handleToggleItem(itemId: string) {
    if (!state) return;
    const selected = state.current.selectedIds;
    const endpoint = selected.includes(itemId)
      ? "/api/choosie/narrow/deselect"
      : "/api/choosie/narrow/select";

    postAction(endpoint, { listId, itemId, participantToken });
  }

  function handleConfirm() {
    postAction("/api/choosie/narrow/confirm", { listId, participantToken });
  }

  if (loading) {
    return <div className="px-4 py-12 text-center text-zinc-600">Loading narrowing session...</div>;
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-zinc-950">Narrowing unavailable</h1>
        <p className="mt-2 text-zinc-600">{error || "This narrowing session could not be loaded."}</p>
      </div>
    );
  }

  return (
    <NarrowingPanel
      items={visibleItems}
      mode={mode}
      roundIndex={state.roundIndex}
      plan={state.plan}
      selectedIds={state.current.selectedIds}
      target={state.current.target}
      winnerId={winnerItemId}
      participantCount={participantCount}
      participantIndex={participantIndex}
      busy={busy}
      error={error}
      onToggleItem={handleToggleItem}
      onConfirm={handleConfirm}
    />
  );
}
