"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getList, upsertList } from "@/lib/storage";
import { computeNarrowingPlan, getRoleName } from "@/lib/planner";
import type { ChoosieList, ChoosieItem } from "@/components/ListForm";
import ProcessSection from "@/components/ProcessSection";

type LocalHistoryEntry = {
  remainingIds: string[];
  currentNarrower: number;
  round: number;
  selectedIds: string[]; // kept locally for undo clarity
};

export default function NarrowPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;
  const searchParams = useSearchParams();
  const participantToken = (searchParams?.get('pt') || '').trim();
  const serverMode = !!participantToken;

  if (serverMode) {
    return <ServerNarrowClient listId={listId} token={participantToken} />;
  }

  const [list, setList] = useState<ChoosieList | null>(null);
  const [remaining, setRemaining] = useState<ChoosieItem[]>([]);
  const [roundTargets, setRoundTargets] = useState<number[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [currentNarrower, setCurrentNarrower] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<LocalHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load / resume list progress
  useEffect(() => {
    const l = getList(listId);
    if (!l) {
      setList(null);
      setLoading(false);
      return;
    }

    // Get participant count from list (default to 4 for backwards compatibility)
    const participants = (l as any).participants || 4;

    // Check if list has been modified since narrowing started
    const listModified = l.progress && l.progress.remainingIds?.length
      ? !l.progress.remainingIds.every((id: string) => l.items.some((item) => item.id === id))
      : false;

    if (l.progress && l.progress.remainingIds?.length && !listModified) {
      // Resume existing progress (only if list hasn't been modified)
      const progress = l.progress;
      const rem = l.items.filter((it) => progress.remainingIds.includes(it.id));
      const desiredPlan = computeNarrowingPlan(rem.length, participants, { participants });
      const existingPlan = l.narrowingPlan && l.narrowingPlan.length ? l.narrowingPlan : null;

      // If participants changed (plan length mismatch), re-initialize to ensure correct number of phases
      const expectedRounds = desiredPlan.length;
      const existingRounds = existingPlan?.length ?? expectedRounds;
      if (existingRounds !== expectedRounds) {
        const updated: ChoosieList = {
          ...l,
          winnerId: undefined,
          narrowingPlan: desiredPlan,
          progress: {
            remainingIds: l.items.map((i) => i.id),
            currentNarrower: 1,
            round: 1,
            totalRounds: desiredPlan.length,
            history: [],
          },
        } as ChoosieList;
        upsertList(updated);
        setList(updated);
        setRemaining(l.items.slice());
        setRoundTargets(desiredPlan);
        setRoundNumber(1);
        setCurrentNarrower(1);
        setHistory([]);
        setSelectedIds([]);
      } else {
        setList(l);
        setRemaining(rem);
        setRoundTargets(existingPlan || desiredPlan);
        setRoundNumber(progress.round || 1);
        setCurrentNarrower(progress.currentNarrower || 1);
        // history in persisted progress does not include selectedIds; keep empty selectedIds locally
        setHistory(
          (progress.history || []).map((h) => ({
            remainingIds: h.remainingIds,
            currentNarrower: h.currentNarrower,
            round: h.round,
            selectedIds: [],
          }))
        );
        setSelectedIds([]);
      }
    } else {
      // Initialize fresh narrowing plan (either no progress exists, or list was modified since last narrowing)
      const initialItems = l.items.slice();
      const plan = l.narrowingPlan && l.narrowingPlan.length
        ? l.narrowingPlan
        : computeNarrowingPlan(initialItems.length, participants, {
            participants,
          });
      const updated: ChoosieList = {
        ...l,
        narrowingPlan: plan,
        progress: {
          remainingIds: initialItems.map((i) => i.id),
          currentNarrower: 1,
          round: 1,
          totalRounds: plan.length,
          history: [],
        },
      };
      upsertList(updated);
      setList(updated);
      setRemaining(initialItems);
      setRoundTargets(plan);
      setRoundNumber(1);
      setCurrentNarrower(1);
      setHistory([]);
      setSelectedIds([]);
    }
    setLoading(false);
  }, [listId]);

  const targetThisRound = roundTargets[roundNumber - 1] || 1;
  const isFinalRound = roundNumber >= roundTargets.length;

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const exists = prev.includes(id);
        if (exists) return prev.filter((x) => x !== id);
        if (prev.length >= targetThisRound) return prev; // can't exceed target
        return [...prev, id];
      });
    },
    [targetThisRound]
  );

  const confirmRound = useCallback(() => {
    if (selectedIds.length !== targetThisRound || !list) return;
    const narrowers = list.narrowers || 3;
    const tail = list.narrowingTail || [5, 3, 1];
    const newRemainingIds = selectedIds.slice();

    const prevHistoryEntry: LocalHistoryEntry = {
      remainingIds: remaining.map((i) => i.id),
      currentNarrower,
      round: roundNumber,
      selectedIds: selectedIds.slice(),
    };

    let nextRound = roundNumber + 1;
    let nextNarrower = currentNarrower + 1;
    if (nextNarrower > narrowers) nextNarrower = 1;

    let winnerId: string | undefined;
    let finalRoundNumber = roundNumber;
    let newPlan = roundTargets.slice();
    if (isFinalRound) {
      winnerId = selectedIds[0];
      finalRoundNumber = roundNumber; // stays
      nextRound = roundNumber; // no more rounds
    }

    const updatedList: ChoosieList = {
      ...list,
      winnerId,
      narrowingPlan: newPlan,
      narrowingTail: tail,
      progress: {
        remainingIds: newRemainingIds,
        currentNarrower: isFinalRound ? currentNarrower : nextNarrower,
        round: isFinalRound ? roundNumber : nextRound,
        totalRounds: newPlan.length,
        history: [
          ...(list.progress?.history || []),
          {
            remainingIds: remaining.map((i) => i.id),
            currentNarrower,
            round: roundNumber,
          },
        ],
      },
    };
    upsertList(updatedList);
    setList(updatedList);
    setHistory((h) => [...h, prevHistoryEntry]);
    setRemaining(list.items.filter((it) => newRemainingIds.includes(it.id)));
    setSelectedIds([]);
    if (!isFinalRound) {
      setRoundNumber(nextRound);
      setCurrentNarrower(nextNarrower);
    }
  }, [selectedIds, targetThisRound, list, remaining, currentNarrower, roundNumber, isFinalRound, roundTargets]);

  const undoLast = useCallback(() => {
    if (!history.length || !list) return;
    const last = history[history.length - 1];
    const newHist = history.slice(0, -1);
    setHistory(newHist);
    setRemaining(list.items.filter((i) => last.remainingIds.includes(i.id)));
    setRoundNumber(last.round);
    setCurrentNarrower(last.currentNarrower);
    setSelectedIds([]);

    // Persist rollback (remove last progress history entry)
    const persistedHistory = (list.progress?.history || []).slice(0, -1);
    const updated: ChoosieList = {
      ...list,
      winnerId: undefined, // undo clears winner if existed
      progress: {
        remainingIds: last.remainingIds,
        currentNarrower: last.currentNarrower,
        round: last.round,
        totalRounds: roundTargets.length,
        history: persistedHistory,
      },
    };
    upsertList(updated);
    setList(updated);
  }, [history, list, roundTargets.length]);

  // Keyboard shortcuts: 1-9 to toggle selection of item index, Enter to confirm
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore if modifier keys or active element is an input/textarea/contentEditable
      const ae = document.activeElement as HTMLElement | null;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!remaining.length || list?.winnerId) return;

      // Number keys 1-9 map to indices 0-8
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < remaining.length) {
          e.preventDefault();
          const item = remaining[idx];
          toggleSelect(item.id);
        }
        return;
      }

      // 0 key maps to index 9 (10th item) if present
      if (e.key === '0') {
        const idx = 9;
        if (idx < remaining.length) {
          e.preventDefault();
          toggleSelect(remaining[idx].id);
        }
        return;
      }

      // Enter confirms when ready
      if (e.key === 'Enter') {
        if (selectedIds.length === targetThisRound) {
          e.preventDefault();
          confirmRound();
        }
        return;
      }

      // Backspace or Escape performs undo (only if selection empty)
      if ((e.key === 'Backspace' || e.key === 'Escape') && selectedIds.length === 0) {
        e.preventDefault();
        undoLast();
        return;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [remaining, selectedIds, targetThisRound, toggleSelect, confirmRound, undoLast, list]);

  const resetAll = useCallback(() => {
    if (!list) return;
    const participants = (list as any).participants || 4;
    const plan = computeNarrowingPlan(list.items.length, participants, {
      participants,
    });
    const updated: ChoosieList = {
      ...list,
      winnerId: undefined,
      narrowingPlan: plan,
      progress: {
        remainingIds: list.items.map((i) => i.id),
        currentNarrower: 1,
        round: 1,
        totalRounds: plan.length,
        history: [],
      },
    };
    upsertList(updated);
    setList(updated);
    setRemaining(list.items.slice());
    setRoundTargets(plan);
    setRoundNumber(1);
    setCurrentNarrower(1);
    setSelectedIds([]);
    setHistory([]);
  }, [list]);

  // Reset progress to initial state and return to list detail
  const resetListAndGoBack = useCallback(() => {
    resetAll();
    if (list) {
      router.push(`/list/${list.id}`);
    }
  }, [resetAll, router, list]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-zinc-500">Loading…</div>
    );
  }

  if (!list) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">List not found</h1>
        <Link
          href="/"
          className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  // Get role and emoji from planner
  const participants = (list as any).participants || 4;
  const { role, emoji } = getRoleName(participants, roundNumber - 1);
  
  // Determine item type based on module
  let itemType = "favorites";
  if (list.moduleType === "movies") {
    itemType = targetThisRound === 1 ? "movie" : "movies";
  } else if (list.moduleType === "books") {
    itemType = targetThisRound === 1 ? "book" : "books";
  } else if (list.moduleType === "music") {
    itemType = targetThisRound === 1 ? "song" : "songs";
  } else if (list.moduleType === "food") {
    itemType = targetThisRound === 1 ? "dish" : "dishes";
  } else {
    itemType = targetThisRound === 1 ? "favorite" : "favorites";
  }

  // If there's a winner, show full-page celebration
  if (list.winnerId) {
    const winner = list.items.find((i) => i.id === list.winnerId);
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 text-6xl animate-bounce">🎉</div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {winner?.image && (
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-md">
                <img
                  src={winner.image}
                  alt={winner.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="mb-3 text-amber-600 font-semibold text-lg">🏆 We have a winner! 🏆</div>
            <div className="text-3xl font-bold text-zinc-800 mb-3">
              {winner?.title || "Chosen"}
            </div>
            {winner?.notes && (
              <div className="text-sm text-zinc-600 mb-6">
                {winner.notes}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-amber-500 mb-6">
              <span className="text-2xl">⭐</span>
              <span className="text-2xl">⭐</span>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {history.length > 0 && (
                <button
                  onClick={undoLast}
                  className="rounded-full px-6 py-3 font-semibold transition-colors ring-1 bg-white text-brand ring-brand/30 hover:bg-brand/5"
                >
                  Undo
                </button>
              )}
              <button
                onClick={resetListAndGoBack}
                className="rounded-full bg-brand px-6 py-3 text-white font-semibold hover:opacity-90 transition-colors"
              >
                Reset list
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProcessSection />
        <h1 className="text-2xl font-bold text-center mb-6">{list.title}</h1>

        {/* Progress timeline */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {roundTargets.map((t, idx) => {
              const isCurrent = idx + 1 === roundNumber;
              const isPast = idx + 1 < roundNumber;
              return (
                <div key={idx} className="flex items-center">
                  {idx > 0 && (
                    <div
                      className={`h-[2px] w-8 mx-1 ${isPast ? "bg-brand" : "bg-zinc-200"}`}
                    />
                  )}
                  <div
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-full px-3 text-sm font-medium transition-all ${
                      isCurrent
                        ? "bg-brand text-white ring-4 ring-brand/20"
                        : isPast
                        ? "bg-brand/20 text-brand"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {t}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mb-1 text-zinc-600">
            Round {Math.min(roundNumber, roundTargets.length)} of {roundTargets.length}
          </div>
          <div className="flex justify-center mb-2">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-sm text-zinc-800 ${
              isFinalRound 
                ? "bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 ring-2 ring-amber-400 animate-pulse" 
                : "bg-white/90 ring-1 ring-brand/20"
            }`}>
              <span aria-hidden className="text-lg">{emoji}</span>
              <span><strong>{role}</strong>, choosie your {targetThisRound === 1 ? "" : `${targetThisRound} `}{itemType}!</span>
            </div>
          </div>
        </div>
        {/* Keyboard hint */}
        <div className="text-center text-xs text-zinc-500 mb-4">
          Pro tip: press 1–9 (and 0 for 10) to select, Enter to confirm{history.length > 0 ? ", Esc to undo" : ""}.
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {remaining.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`relative flex flex-col items-start p-4 rounded-2xl bg-white/90 shadow-md border-2 transition-all duration-300 focus:outline-none ${
                  selected
                    ? isFinalRound
                      ? "border-amber-400 scale-105 shadow-2xl ring-4 ring-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
                      : "border-brand scale-105 ring-4 ring-brand/40 bg-brand/5"
                    : "border-transparent hover:scale-[1.02]"
                }`}
              >
                {selected && isFinalRound && (
                  <div className="absolute -top-3 -right-3 text-3xl animate-bounce">🎉</div>
                )}
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-36 object-cover rounded-md mb-3"
                  />
                ) : (
                  <div className="w-full h-36 rounded-md bg-white/60 mb-3 flex items-center justify-center text-zinc-400">
                    📷
                  </div>
                )}
                {/* Check mark icon for selected items */}
                {selected && (
                  <div className="absolute bottom-3 right-3 text-green-600 bg-white rounded-full shadow p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className={`font-semibold ${selected && isFinalRound ? "text-amber-700" : ""}`}>{item.title}</div>
                {item.notes && (
                  <div className="text-sm text-zinc-500 line-clamp-3">{item.notes}</div>
                )}
                <div className={`mt-2 text-xs ${selected && isFinalRound ? "text-amber-600 font-semibold" : "text-zinc-500"}`}>
                  {selected
                    ? isFinalRound ? "🏆 The Winner!" : `Selected (${selectedIds.indexOf(item.id) + 1})`
                    : `Tap to select`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {history.length > 0 && (
            <button
              onClick={undoLast}
              className="rounded-full px-6 py-3 text-sm bg-white/70 text-zinc-700 hover:bg-white"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => setSelectedIds([])}
            disabled={selectedIds.length === 0}
            className={`rounded-full bg-white/70 px-6 py-3 text-zinc-700 hover:bg-white ${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Deselect all
          </button>
          <button
            onClick={() => router.push(`/list/${list.id}`)}
            className="rounded-full bg-zinc-100 px-6 py-3 text-zinc-700"
          >
            Back to list
          </button>
          <button
            onClick={confirmRound}
            disabled={selectedIds.length !== targetThisRound}
            className={`rounded-full px-6 py-3 font-semibold text-white transition-all duration-300 ${
              selectedIds.length === targetThisRound
                ? isFinalRound
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:scale-105 hover:shadow-xl animate-pulse"
                  : "bg-brand hover:opacity-90"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {isFinalRound ? "🎉 Finalize Winner! 🎉" : "Confirm"} ({selectedIds.length}/{targetThisRound})
          </button>
        </div>

        <div className="text-center mt-4 text-sm text-zinc-500">
          {remaining.length} item{remaining.length === 1 ? "" : "s"} available
        </div>


      </div>
    </main>
  );
}

// Server-backed narrowing client for virtual participants
function ServerNarrowClient({ listId, token }: { listId: string; token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [moduleType, setModuleType] = useState<string>("movies");
  const [role, setRole] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ id: string; title: string; image?: string | null }>>([]);
  const [remainingIds, setRemainingIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [plan, setPlan] = useState<number[]>([]);
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [winnerItemId, setWinnerItemId] = useState<string | null>(null);

  const targetThisRound = plan[roundIndex] ?? 1;
  const participants = plan.length + 1;
  const { role: computedRole, emoji } = getRoleName(Math.max(participants, 2), roundIndex);
  const effectiveRole = role || computedRole;

  const remaining = items.filter((i) => remainingIds.includes(i.id));
  const isFinalRound = roundIndex >= plan.length - 1;

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [stateRes, pubRes] = await Promise.all([
        fetch('/api/choosie/narrow/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId }) }),
        fetch('/api/choosie/public/getList', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId, token }) }),
      ]);
      const stateJson = stateRes.ok ? await stateRes.json() : null;
      const pubJson = pubRes.ok ? await pubRes.json() : null;
      if (!stateJson?.ok) throw new Error(stateJson?.error || 'Failed to load state');
      if (!pubJson?.ok) throw new Error(pubJson?.error || 'Failed to load list');
      setItems(stateJson.items || []);
      setRemainingIds(stateJson.state?.current?.remainingIds || []);
      setSelectedIds(stateJson.state?.current?.selectedIds || []);
      setPlan(stateJson.state?.plan || []);
      setRoundIndex(stateJson.state?.roundIndex || 0);
      setWinnerItemId(stateJson.winnerItemId || null);
      setTitle(pubJson.list?.title || '');
      setModuleType(pubJson.list?.moduleType || 'movies');
      setRole(pubJson.list?.participantRole || null);
    } catch (e: any) {
      setError(e?.message || 'Unable to load');
    } finally {
      setLoading(false);
    }
  }

  // Polling for state updates
  useEffect(() => {
    loadInitial();
    const t = setInterval(async () => {
      try {
        const res = await fetch('/api/choosie/narrow/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId }) });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.ok) return;
        setItems(data.items || []);
        setRemainingIds(data.state?.current?.remainingIds || []);
        setSelectedIds(data.state?.current?.selectedIds || []);
        setPlan(data.state?.plan || []);
        setRoundIndex(data.state?.roundIndex || 0);
        setWinnerItemId(data.winnerItemId || null);
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [listId]);

  async function selectItem(itemId: string) {
    try {
      const endpoint = selectedIds.includes(itemId) ? '/api/choosie/narrow/deselect' : '/api/choosie/narrow/select';
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId, itemId, participantToken: token }) });
      const data = await res.json();
      if (data?.ok) {
        setRemainingIds(data.state?.current?.remainingIds || remainingIds);
        setSelectedIds(data.state?.current?.selectedIds || selectedIds);
        setPlan(data.state?.plan || plan);
        setRoundIndex(data.state?.roundIndex ?? roundIndex);
      }
    } catch {}
  }

  async function confirmRound() {
    try {
      const res = await fetch('/api/choosie/narrow/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId, participantToken: token }) });
      const data = await res.json();
      if (data?.ok) {
        setRemainingIds(data.state?.current?.remainingIds || remainingIds);
        setSelectedIds(data.state?.current?.selectedIds || []);
        setPlan(data.state?.plan || plan);
        setRoundIndex(data.state?.roundIndex ?? roundIndex);
        setWinnerItemId(data.winnerItemId || null);
      } else if (data?.error) {
        alert(data.error);
      }
    } catch {}
  }

  async function undoRound() {
    try {
      const res = await fetch('/api/choosie/narrow/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId, participantToken: token }) });
      const data = await res.json();
      if (data?.ok) {
        setRemainingIds(data.state?.current?.remainingIds || remainingIds);
        setSelectedIds(data.state?.current?.selectedIds || selectedIds);
        setPlan(data.state?.plan || plan);
        setRoundIndex(data.state?.roundIndex ?? roundIndex);
        setWinnerItemId(data.winnerItemId || null);
      } else if (data?.error) {
        alert(data.error);
      }
    } catch {}
  }

  if (loading) {
    return <div className="max-w-xl mx-auto py-16 text-center text-zinc-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Unable to join</h1>
        <p className="text-zinc-600 mb-4">{error}</p>
        <button onClick={() => router.push('/')} className="rounded-full bg-brand px-6 py-3 font-semibold text-white">Return Home</button>
      </div>
    );
  }

  // Winner view
  if (winnerItemId) {
    const winner = items.find((i) => i.id === winnerItemId);
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 text-6xl animate-bounce">🎉</div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-3 text-amber-600 font-semibold text-lg">🏆 We have a winner! 🏆</div>
            <div className="text-3xl font-bold text-zinc-800 mb-3">{winner?.title || 'Chosen'}</div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={undoRound} className="rounded-full px-6 py-3 font-semibold transition-colors ring-1 bg-white text-brand ring-brand/30 hover:bg-brand/5">Undo</button>
              <button onClick={() => router.push(`/list/${listId}`)} className="rounded-full bg-brand px-6 py-3 text-white font-semibold hover:opacity-90">Back to list</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProcessSection />
        <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>
        <div className="text-center mb-4 text-zinc-600 text-sm">{effectiveRole ? `${effectiveRole} • ` : ''}Round {Math.min(roundIndex + 1, plan.length)} of {plan.length}</div>
        <div className="flex justify-center mb-6">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-sm text-zinc-800 ${
            isFinalRound ? "bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 ring-2 ring-amber-400 animate-pulse" : "bg-white/90 ring-1 ring-brand/20"
          }`}>
            <span aria-hidden className="text-lg">{emoji}</span>
            <span><strong>{effectiveRole || 'Your turn'}</strong>, pick {targetThisRound} {targetThisRound === 1 ? 'item' : 'items'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {remaining.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => selectItem(item.id)}
                className={`relative flex flex-col items-start p-4 rounded-2xl bg-white/90 shadow-md border-2 transition-all duration-300 focus:outline-none ${
                  selected
                    ? isFinalRound
                      ? "border-amber-400 scale-105 shadow-2xl ring-4 ring-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50"
                      : "border-brand scale-105 ring-4 ring-brand/40 bg-brand/5"
                    : "border-transparent hover:scale-[1.02]"
                }`}
              >
                <div className={`font-semibold ${selected && isFinalRound ? "text-amber-700" : ""}`}>{item.title}</div>
                <div className={`mt-2 text-xs ${selected && isFinalRound ? "text-amber-600 font-semibold" : "text-zinc-500"}`}>
                  {selected
                    ? isFinalRound ? "🏆 The Winner!" : `Selected (${selectedIds.indexOf(item.id) + 1})`
                    : `Tap to select`}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={undoRound}
            className="rounded-full px-6 py-3 text-sm bg-white/70 text-zinc-700 hover:bg-white"
          >
            Undo
          </button>
          <button
            onClick={confirmRound}
            disabled={selectedIds.length !== targetThisRound}
            className={`rounded-full px-6 py-3 font-semibold text-white transition-all duration-300 ${
              selectedIds.length === targetThisRound
                ? isFinalRound
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:scale-105 hover:shadow-xl animate-pulse"
                  : "bg-brand hover:opacity-90"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {isFinalRound ? "🎉 Finalize Winner! 🎉" : "Confirm"} ({selectedIds.length}/{targetThisRound})
          </button>
        </div>

        <div className="text-center mt-4 text-sm text-zinc-500">
          {remaining.length} item{remaining.length === 1 ? "" : "s"} available
        </div>
      </div>
    </main>
  );
}
