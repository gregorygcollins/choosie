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

  useEffect(() => {
    async function load() {
      setLoading(true);
      const id = params?.id as string;
      const l = await getList(id);
      if (l) {
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
      }
      setLoading(false);
    }
    load();
  }, [params]);

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

  if (loading) {
    return <div className="max-w-xl mx-auto py-16 text-center text-zinc-500">Loading…</div>;
  }
  if (!list) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">List not found</h1>
        <Link href="/" className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors">Return Home</Link>
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

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProcessSection />
        <h1 className="text-2xl font-bold text-center mb-6">{list.title}</h1>
        {/* Minimal narrowing UI placeholder */}
        <div className="flex flex-col items-center gap-4">
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
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'flex flex-col gap-2 w-full max-w-2xl'}>
            {remaining.map((item) => (
              <div
                key={item.id}
                className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${selectedIds.includes(item.id) ? 'ring-2 ring-brand' : 'hover:ring-1 hover:ring-brand/50'}`}
                onClick={() => toggleSelect(item.id)}
              >
                <div className="flex items-center gap-3">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-lg" />
                  )}
                  <div>
                    <div className="font-bold text-lg">{item.title}</div>
                    <button
                      className="text-xs text-blue-600 underline mt-1"
                      onClick={e => { e.stopPropagation(); setInfoModalItem(item); }}
                    >
                      Info
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              className="rounded-full bg-brand px-6 py-3 text-white font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
              onClick={confirmRound}
              disabled={selectedIds.length !== targetThisRound}
            >
              Confirm ({selectedIds.length}/{targetThisRound})
            </button>
            <button
              className="rounded-full px-6 py-3 font-semibold transition-colors ring-1 bg-white text-brand ring-brand/30 hover:bg-brand/5"
              onClick={undoLast}
              disabled={history.length === 0}
            >
              Undo
            </button>
            <button
              className="rounded-full px-6 py-3 font-semibold transition-colors ring-1 bg-white text-brand ring-brand/30 hover:bg-brand/5"
              onClick={resetAll}
            >
              Reset
            </button>
          </div>
        </div>
        {/* Info Modal */}
        {infoModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative">
              <button
                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-700 text-2xl"
                onClick={() => setInfoModalItem(null)}
                aria-label="Close"
              >
                ×
              </button>
              {infoModalItem.image && (
                <img src={infoModalItem.image} alt={infoModalItem.title} className="w-32 h-32 object-cover rounded-lg mx-auto mb-4" />
              )}
              <div className="text-xl font-bold mb-2 text-center">{infoModalItem.title}</div>
              <div className="text-zinc-700 text-sm whitespace-pre-line mb-2">{infoModalItem.notes}</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}