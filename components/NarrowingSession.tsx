"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NarrowingPanel } from "@/components/NarrowingPanel";
import { getRoleName } from "@/lib/planner";

type SessionMode = "in-person" | "virtual";

type ApiItem = {
  id: string;
  title: string;
  notes?: string | null;
  image?: string | null;
};

type DisplayItem = ApiItem & {
  status?: "active" | "cut";
};

type ParticipantClaim = {
  name: string;
  role: string;
  joined?: boolean;
  sessionId?: string;
};

type NarrowingState = {
  plan: number[];
  roundIndex: number;
  rounds?: Array<{
    round?: number;
    role?: string | null;
    participant?: string | null;
    chosenIds?: string[];
    prevRemaining?: string[];
  }>;
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
  listTitle?: string;
  listDescription?: string | null;
};

type NarrowingSessionProps = {
  listId: string;
  mode: SessionMode;
  participantIndex?: number | null;
  viewerRole?: string;
};

type ActivityLogEntry = {
  id: string;
  text: string;
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

function mergeItemsByCurrentOrder(nextItems: ApiItem[], currentItems: ApiItem[]) {
  if (currentItems.length === 0) return nextItems;

  const nextById = new Map(nextItems.map((item) => [item.id, item]));
  const ordered = currentItems
    .map((item) => nextById.get(item.id))
    .filter((item): item is ApiItem => Boolean(item));
  const orderedIds = new Set(ordered.map((item) => item.id));
  const added = nextItems.filter((item) => !orderedIds.has(item.id));

  return [...ordered, ...added];
}

export function NarrowingSession({ listId, mode, participantIndex = 0, viewerRole: viewerRoleProp }: NarrowingSessionProps) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState<string | null>(null);
  const [state, setState] = useState<NarrowingState | null>(null);
  const [winnerItemId, setWinnerItemId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [participants, setParticipants] = useState<ParticipantClaim[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const previousStateRef = useRef<NarrowingState | null>(null);

  const viewerRole = viewerRoleProp || (participantIndex == null ? "Organizer" : undefined);
  const participantToken = participantIndex == null ? "organizer" : String(participantIndex);
  const isOrganizerSpectator = mode === "virtual" && participantIndex == null;

  function getActionToken(action: "current" | "previous" = "current") {
    if (isOrganizerSpectator) return "organizer";
    if (mode === "virtual") return participantToken;
    const count = Math.max(1, participantCount);
    const index = state?.roundIndex || 0;
    return String(action === "previous" ? Math.max(0, index - 1) % count : index % count);
  }

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

      setItems((prev) => mergeItemsByCurrentOrder(json.items!, prev));
      setListTitle(json.listTitle || "Untitled list");
      setListDescription(json.listDescription || null);
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
    if (mode !== "virtual" || usePolling) return;
    let closed = false;
    const source = new EventSource(`/api/choosie/narrow/stream?listId=${encodeURIComponent(listId)}`);

    source.onmessage = (event) => {
      if (closed) return;
      try {
        const data = JSON.parse(event.data);
        if (data?.state) {
          setState(normalizeState(data.state));
          if ("winnerItemId" in data) setWinnerItemId(data.winnerItemId || null);
        }
      } catch {}
    };

    source.onerror = () => {
      if (closed) return;
      setUsePolling(true);
      source.close();
    };

    return () => {
      closed = true;
      source.close();
    };
  }, [listId, mode, usePolling]);

  useEffect(() => {
    if (mode !== "virtual") return;
    const interval = window.setInterval(() => {
      loadState({ silent: true });
    }, usePolling ? 2500 : 8000);

    return () => window.clearInterval(interval);
  }, [loadState, mode, usePolling]);

  useEffect(() => {
    if (mode !== "virtual") return;
    let cancelled = false;

    async function loadParticipants() {
      try {
        const query = new URLSearchParams({ listId });
        const sessionId = new URLSearchParams(window.location.search).get("session");
        if (sessionId) query.set("sessionId", sessionId);
        const res = await fetch(`/api/choosie/narrow/participants?${query.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data?.ok && Array.isArray(data.participants)) {
          setParticipants(data.participants);
        }
      } catch {}
    }

    loadParticipants();
    const interval = window.setInterval(loadParticipants, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [listId, mode]);

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

  useEffect(() => {
    const remaining = new Set(state?.current.remainingIds || []);
    const activeItems = items.filter((item) => remaining.has(item.id));

    setDisplayItems((prev) => {
      const activeIds = new Set(activeItems.map((item) => item.id));
      const prevById = new Map(prev.map((item) => [item.id, item]));
      const activeById = new Map(activeItems.map((item) => [item.id, item]));
      const nextInPreviousOrder = prev.map((item) => {
        const activeItem = activeById.get(item.id);
        if (activeItem) return { ...item, ...activeItem, status: "active" as const };
        return { ...item, status: "cut" as const };
      });
      const previousIds = new Set(prev.map((item) => item.id));
      const added = activeItems
        .filter((item) => !previousIds.has(item.id))
        .map((item) => ({ ...prevById.get(item.id), ...item, status: "active" as const }));

      return [...nextInPreviousOrder, ...added].filter((item) => activeIds.has(item.id) || item.status === "cut");
    });

    const timeout = window.setTimeout(() => {
      setDisplayItems((prev) => prev.filter((item) => remaining.has(item.id)));
    }, 520);

    return () => window.clearTimeout(timeout);
  }, [items, state?.current.remainingIds]);

  useEffect(() => {
    if (!state) return;
    const previous = previousStateRef.current;
    previousStateRef.current = state;
    if (!previous || state.roundIndex <= previous.roundIndex) return;

    const before = previous.current.remainingIds || [];
    const after = new Set(state.current.remainingIds || []);
    const eliminated = before.filter((id) => !after.has(id));
    if (eliminated.length === 0) return;

    const role = getRoleName(participantCount + 1, previous.roundIndex).role;
    const itemById = new Map(items.map((item) => [item.id, item.title]));
    const timestamp = Date.now();
    setActivityLog((prev) => [
      ...prev,
      ...eliminated.map((id, index) => ({
        id: `${timestamp}-${id}-${index}`,
        text: `${role} eliminated ${itemById.get(id) || "an option"}.`,
      })),
    ].slice(-16));
  }, [items, participantCount, state]);

  function handleReorderItems(from: number, to: number) {
    const ids = visibleItems.map((item) => item.id);
    if (from < 0 || to < 0 || from >= ids.length || to >= ids.length || from === to) return;

    const nextIds = [...ids];
    const [moved] = nextIds.splice(from, 1);
    nextIds.splice(to, 0, moved);
    const rank = new Map(nextIds.map((id, index) => [id, index]));

    setItems((prev) =>
      [...prev].sort((a, b) => {
        const aRank = rank.get(a.id);
        const bRank = rank.get(b.id);
        if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
        if (aRank !== undefined) return -1;
        if (bRank !== undefined) return 1;
        return 0;
      })
    );
  }

  async function requestAction(endpoint: string, body: Record<string, string>): Promise<NarrowingResponse & { state: NarrowingState }> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: NarrowingResponse = await res.json();
    if (!res.ok || !json.ok || !json.state) {
      throw new Error(json.error || "Narrowing action failed");
    }

    return json as NarrowingResponse & { state: NarrowingState };
  }

  async function postAction(endpoint: string, body: Record<string, string>) {
    setBusy(true);
    setError(null);

    try {
      const json = await requestAction(endpoint, body);
      setState(normalizeState(json.state));
      if ("winnerItemId" in json) setWinnerItemId(json.winnerItemId || null);
    } catch (err: any) {
      setError(err?.message || "Narrowing action failed");
    } finally {
      setBusy(false);
    }
  }

  function handleToggleItem(itemId: string) {
    if (!state || isOrganizerSpectator) return;
    const selected = state.current.selectedIds;
    const endpoint = selected.includes(itemId)
      ? "/api/choosie/narrow/deselect"
      : "/api/choosie/narrow/select";

    postAction(endpoint, { listId, itemId, participantToken: getActionToken() });
  }

  function handleConfirm() {
    if (isOrganizerSpectator) return;
    postAction("/api/choosie/narrow/confirm", { listId, participantToken: getActionToken() });
  }

  async function handleSurpriseMe() {
    if (!state || isOrganizerSpectator) return;
    const target = state.current.target;
    const candidates = visibleItems.map((item) => item.id);
    if (candidates.length < target) {
      setError("There are not enough options left to narrow.");
      return;
    }

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const chosen = new Set(shuffled.slice(0, target));
    const participantToken = getActionToken();

    setBusy(true);
    setError(null);
    try {
      for (const itemId of state.current.selectedIds) {
        if (!chosen.has(itemId)) {
          await requestAction("/api/choosie/narrow/deselect", { listId, itemId, participantToken });
        }
      }

      for (const itemId of chosen) {
        if (!state.current.selectedIds.includes(itemId)) {
          await requestAction("/api/choosie/narrow/select", { listId, itemId, participantToken });
        }
      }

      const json = await requestAction("/api/choosie/narrow/confirm", { listId, participantToken });
      setState(normalizeState(json.state));
      if ("winnerItemId" in json) setWinnerItemId(json.winnerItemId || null);
    } catch (err: any) {
      setError(err?.message || "Surprise me could not complete this turn.");
      await loadState({ silent: true });
    } finally {
      setBusy(false);
    }
  }

  function handleUndo() {
    if (isOrganizerSpectator) return;
    postAction("/api/choosie/narrow/undo", { listId, participantToken: getActionToken("previous") });
  }

  function handleReset() {
    if (!window.confirm("Reset this narrowing session back to the full list?")) return;
    postAction("/api/choosie/narrow/reset", { listId });
  }

  async function handleShareWinner() {
    const winner = items.find((item) => item.id === winnerItemId);
    const winnerName = winner?.title || "the winner";
    const text = `${winnerName} won "${listTitle || "our Choosie list"}".`;
    const path = mode === "virtual" ? `/list/${listId}/virtual` : `/narrow/${listId}`;
    const url = `${window.location.origin}${path}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Choosie winner",
          text,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(`${text} ${url}`);
      window.alert("Winner copied to clipboard.");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError("Failed to share winner");
      }
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-zinc-600">
        Loading narrowing session...
      </div>
    );
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
      listTitle={listTitle}
      listDescription={listDescription}
      items={displayItems.map((item) => ({
        id: item.id,
        name: item.title,
        notes: item.notes,
        image: item.image,
        status: item.status,
      }))}
      mode={mode}
      roundIndex={state.roundIndex}
      plan={state.plan}
      selectedIds={state.current.selectedIds}
      target={state.current.target}
      winnerId={winnerItemId}
      participantCount={participantCount}
      participantIndex={participantIndex ?? 0}
      viewerRole={viewerRole}
      isSpectator={isOrganizerSpectator}
      participants={participants}
      activityLog={activityLog}
      busy={busy}
      error={error}
      onToggleItem={handleToggleItem}
      onReorderItems={handleReorderItems}
      onConfirm={handleConfirm}
      onSurpriseMe={handleSurpriseMe}
      onUndo={handleUndo}
      onReset={handleReset}
      onReturnToList={() => {
        window.location.href = `/list/${listId}`;
      }}
      onShareWinner={handleShareWinner}
    />
  );
}
