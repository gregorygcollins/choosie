"use client";
import { useEffect, useState, useCallback } from "react";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getList, upsertList } from "@/lib/storage";
import { computeNarrowingPlan, getRoleName } from "@/lib/planner";
import type { ChoosieList, ChoosieItem } from "@/components/ListForm";
import ProcessSection from "@/components/ProcessSection";

type LocalHistoryEntry = {
  remainingIds: string[];
  currentNarrower: number;
  round: number;
  selectedIds: string[];
};


export default function NarrowPage() {
  const params = useParams();
  const router = useRouter();
  const [list, setList] = useState<ChoosieList | null>(null);
  const [remaining, setRemaining] = useState<ChoosieItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [currentNarrower, setCurrentNarrower] = useState(1);
  const [roundTargets, setRoundTargets] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<LocalHistoryEntry[]>([]);
  const [infoModalItem, setInfoModalItem] = useState<ChoosieItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showThankYou, setShowThankYou] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Debug panel state
  const [debug, setDebug] = useState({
    listId: '',
    hasLocalList: false,
    serverFetchStatus: '',
    narrowStateFetchStatus: '',
    loading: true,
    error: '',
  });


  // Always fetch the latest list (including title) from the backend
  const fetchLatestList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setDebug((d) => ({ ...d, loading: true, error: '', listId: '', hasLocalList: false, serverFetchStatus: '', narrowStateFetchStatus: '' }));
    const id = params?.id as string;
    setDebug((d) => ({ ...d, listId: id }));
    try {
      const res = await fetch("/api/choosie/getList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && data.list) {
          const l = data.list;
          upsertList(l);
          setDebug((d) => ({ ...d, serverFetchStatus: 'success' }));
          if (l.progress && l.narrowingPlan) {
            setDebug((d) => ({ ...d, narrowStateFetchStatus: 'present' }));
            setList(l);
            setRemaining(l.items.filter((i) => l.progress?.remainingIds?.includes(i.id)));
            setRoundTargets(l.narrowingPlan || []);
            setRoundNumber(l.progress?.round || 1);
            setCurrentNarrower(l.progress?.currentNarrower || 1);
            setSelectedIds((l.progress as any)?.selectedIds || []);
            setHistory(
              (l.progress?.history || []).map((h: any) => ({
                ...h,
                selectedIds: h.selectedIds || [],
              }))
            );
          } else {
            setDebug((d) => ({ ...d, narrowStateFetchStatus: 'missing' }));
            setList(l);
          }
        } else {
          setDebug((d) => ({ ...d, serverFetchStatus: 'fail', error: 'API response missing list' }));
          setLoadError("Could not load this list.");
        }
      } else {
        setDebug((d) => ({ ...d, serverFetchStatus: 'fail', error: 'API response not ok' }));
        setLoadError("Could not load this list.");
      }
    } catch (e) {
      setDebug((d) => ({ ...d, serverFetchStatus: 'fail', error: 'fetch threw' }));
      setLoadError("Could not load this list.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchLatestList();
    // eslint-disable-next-line
  }, [fetchLatestList]);

  // After every narrowing action, always fetch the latest list
  const refetchAfterAction = async () => {
    await fetchLatestList();
  };


  const targetThisRound = roundTargets[roundNumber - 1] || 1;
  const isFinalRound = roundNumber === roundTargets.length;

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const exists = prev.includes(id);
        if (exists) return prev.filter((x) => x !== id);
        if (prev.length >= targetThisRound) return prev;
        return [...prev, id];
      });
    },
    [targetThisRound]
  );


  const confirmRound = useCallback(async () => {
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
      finalRoundNumber = roundNumber;
      nextRound = roundNumber;
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
      setShowThankYou(true);
    } else {
      setRoundNumber(nextRound);
      setCurrentNarrower(nextNarrower);
    }
    await refetchAfterAction();
  }, [selectedIds, targetThisRound, list, remaining, currentNarrower, roundNumber, isFinalRound, roundTargets, refetchAfterAction]);

  const undoLast = useCallback(() => {
    if (!history.length || !list) return;
    const last = history[history.length - 1];
    const newHist = history.slice(0, -1);
    setHistory(newHist);
    setRemaining(list.items.filter((i) => last.remainingIds.includes(i.id)));
    setRoundNumber(last.round);
    setCurrentNarrower(last.currentNarrower);
    setSelectedIds([]);

    const persistedHistory = (list.progress?.history || []).slice(0, -1);
    const updated: ChoosieList = {
      ...list,
      winnerId: undefined,
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ae = document.activeElement as HTMLElement | null;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!remaining.length || list?.winnerId) return;
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < remaining.length) {
          e.preventDefault();
          const item = remaining[idx];
          toggleSelect(item.id);
        }
        return;
      }
      if (e.key === '0') {
        const idx = 9;
        if (idx < remaining.length) {
          e.preventDefault();
          toggleSelect(remaining[idx].id);
        }
        return;
      }
      if (e.key === 'Enter') {
        if (selectedIds.length === targetThisRound) {
          e.preventDefault();
          confirmRound();
        }
        return;
      }
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
    const plan = computeNarrowingPlan(list.items.length, participants, { participants });
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

  const resetListAndGoBack = useCallback(() => {
    resetAll();
    if (list) {
      router.push(`/list/${list.id}`);
    }
  }, [resetAll, router, list]);

  // Debug panel
  const DebugPanel = () => (
    <div style={{ position: 'fixed', bottom: 0, left: 0, background: '#fff', color: '#222', fontSize: 12, padding: 8, border: '1px solid #ccc', zIndex: 9999 }}>
      <div><b>listId:</b> {debug.listId}</div>
      <div><b>hasLocalList:</b> {String(debug.hasLocalList)}</div>
      <div><b>serverFetchStatus:</b> {debug.serverFetchStatus}</div>
      <div><b>narrowStateFetchStatus:</b> {debug.narrowStateFetchStatus}</div>
      <div><b>loading:</b> {String(loading)}</div>
      <div><b>error:</b> {debug.error || loadError || ''}</div>
    </div>
  );

  if (!mounted || loading) {
    return <div className="max-w-xl mx-auto py-16 text-center text-zinc-500">Loading…<DebugPanel /></div>;
  }
  if (loadError) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{loadError}</h1>
        <Link href="/" className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors">Return Home</Link>
        <DebugPanel />
      </div>
    );
  }
  if (!list) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">List not found</h1>
        <Link href="/" className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors">Return Home</Link>
        <DebugPanel />
      </div>
    );
  }
  if (!list.progress || !list.narrowingPlan) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Virtual narrowing has not started yet.</h1>
        <Link href="/" className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors">Return Home</Link>
        <DebugPanel />
      </div>
    );
  }

  const participants = (list as any).participants || 4;
  const { role, emoji } = getRoleName(participants, roundNumber - 1);
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

  if (list.winnerId) {
    const winner = list.items.find((i) => i.id === list.winnerId);
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 text-6xl animate-bounce">🎉</div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {winner?.image && (
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-md">
                <img src={winner.image} alt={winner.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="mb-3 text-amber-600 font-semibold text-lg">🏆 We have a winner! 🏆</div>
            <div className="text-3xl font-bold text-zinc-800 mb-3">{winner?.title || "Chosen"}</div>
            {winner?.notes && (<div className="text-sm text-zinc-600 mb-6">{winner.notes}</div>)}
            <div className="flex items-center justify-center gap-2 text-amber-500 mb-6">
              <span className="text-2xl">⭐</span>
              <span className="text-2xl">⭐</span>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {history.length > 0 && (
                <button onClick={undoLast} className="rounded-full px-6 py-3 font-semibold transition-colors ring-1 bg-white text-brand ring-brand/30 hover:bg-brand/5">Undo</button>
              )}
              <button onClick={resetListAndGoBack} className="rounded-full bg-brand px-6 py-3 text-white font-semibold hover:opacity-90 transition-colors">Reset list</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Determine if this is the active narrower for the current round
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const participantToken = urlParams?.get("pt") || "";
  // For virtual narrowing, the token matches the round index (0-based)
  const activeNarrowerIndex = roundNumber - 1;
  // For now, assume tokens are assigned in order
  // Once a participant has completed their round, they should not be able to act again
  const tokenIndex = participantToken ? Number(participantToken.split('.')[0]) : -1;
  // In-person: if no pt token, always allow narrowing
  const isInPerson = !participantToken;
  const isActiveNarrower = isInPerson || tokenIndex === activeNarrowerIndex;
  const hasAlreadyNarrowed = !isInPerson && tokenIndex > -1 && tokenIndex < activeNarrowerIndex;

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProcessSection />
        <h1 className="text-2xl font-bold text-center mb-6">{list.title}</h1>
        {/* Thank You Modal */}
        {showThankYou && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center relative">
              <div className="text-3xl mb-4">🎉</div>
              <div className="text-xl font-bold mb-2">Thank you for narrowing!</div>
              <div className="text-zinc-700 mb-4">Please pass the device or link to the next narrower.</div>
              <button
                className="rounded-full bg-brand px-6 py-3 text-white font-semibold hover:opacity-90 transition-colors"
                onClick={() => {
                  setShowThankYou(false);
                  // After confirming, reload the page to update the active narrower state
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}
        {/* Minimal narrowing UI placeholder */}
        {!showThankYou && (
          <div className="flex flex-col items-center gap-4">
            {/* Only allow selection for the active narrower; show waiting/progress for others */}
            {isActiveNarrower ? (
              <>
                <div className="mb-4">
                  <button
                    className={`px-4 py-2 rounded-full font-semibold mr-2 ${viewMode === 'grid' ? 'bg-brand text-white' : 'bg-zinc-200 text-zinc-700'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    Grid View
                  </button>
                  <button
                    className={`px-4 py-2 rounded-full font-semibold ${viewMode === 'list' ? 'bg-brand text-white' : 'bg-zinc-200 text-zinc-700'}`}
                    onClick={() => setViewMode('list')}
                  >
                    List View
                  </button>
                </div>
              </>
            ) : (
              <div className="text-zinc-500 text-center py-8">
                Waiting for your turn…
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

