"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getList, upsertList } from "@/lib/storage";
import { computeNarrowingPlan } from "@/lib/planner";
import type { ChoosieList, ChoosieItem } from "@/components/ListForm";

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

    const narrowers = l.narrowers || 3;
    const tail = l.narrowingTail || [5, 3, 1];

    if (l.progress && l.progress.remainingIds?.length) {
      // Resume existing progress
      const progress = l.progress;
      const rem = l.items.filter((it) => progress.remainingIds.includes(it.id));
      const plan = l.narrowingPlan && l.narrowingPlan.length
        ? l.narrowingPlan
        : computeNarrowingPlan(rem.length, narrowers, {
            tail,
            minReductionFraction: l.minReductionFraction || 0.2,
          });
      setList(l);
      setRemaining(rem);
      setRoundTargets(plan);
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
    } else {
      // Initialize fresh narrowing plan
      const initialItems = l.items.slice();
      const plan = l.narrowingPlan && l.narrowingPlan.length
        ? l.narrowingPlan
        : computeNarrowingPlan(initialItems.length, narrowers, {
            tail,
            minReductionFraction: l.minReductionFraction || 0.2,
          });
      const updated: ChoosieList = {
        ...l,
        narrowingPlan: plan,
        narrowingTail: tail,
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

  const resetAll = useCallback(() => {
    if (!list) return;
    const narrowers = list.narrowers || 3;
    const tail = list.narrowingTail || [5, 3, 1];
    const plan = computeNarrowingPlan(list.items.length, narrowers, {
      tail,
      minReductionFraction: list.minReductionFraction || 0.2,
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

  // Banner role logic
  let role = "Curator";
  let emoji = "🎨";
  if (isFinalRound) {
    role = "Decider";
    emoji = "🏆";
  } else if (roundNumber === 2) {
    role = "Selector";
    emoji = "🎯";
  } else if (roundNumber > 2) {
    role = `Narrower ${currentNarrower}`;
    emoji = "✨";
  }
  const targetLabel = targetThisRound === 1 ? "pick" : "picks";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-brand/20 text-zinc-800">
            <span aria-hidden className="text-lg">{emoji}</span>
            <span><strong>{role}</strong>, choose {targetThisRound} {targetLabel}!</span>
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {remaining.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`flex flex-col items-start p-4 rounded-2xl bg-white/90 shadow-md border-2 transition-transform focus:outline-none ${
                selected
                  ? "border-brand scale-105"
                  : "border-transparent hover:scale-[1.02]"
              }`}
            >
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
              <div className="font-semibold">{item.title}</div>
              {item.notes && (
                <div className="text-sm text-zinc-500 line-clamp-3">{item.notes}</div>
              )}
              <div className="mt-2 text-xs text-zinc-500">
                {selected
                  ? `Selected (${selectedIds.indexOf(item.id) + 1})`
                  : `Tap to select`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={undoLast}
          disabled={history.length === 0}
          className={`rounded-full px-6 py-3 text-sm ${
            history.length === 0
              ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              : "bg-white/70 text-zinc-700 hover:bg-white"
          }`}
        >
          ← Back
        </button>
        <button
          onClick={resetAll}
          className="rounded-full bg-white/70 px-6 py-3 text-zinc-700 hover:bg-white"
        >
          Reset
        </button>
        <button
          onClick={() => router.push(`/list/${list.id}`)}
          className="rounded-full bg-zinc-100 px-6 py-3 text-zinc-700"
        >
          Back to {list.moduleType === "music"
            ? "musiclist"
            : list.moduleType === "food"
            ? "foodlist"
            : list.moduleType === "books"
            ? "booklist"
            : "watchlist"}
        </button>
        <button
          onClick={confirmRound}
          disabled={selectedIds.length !== targetThisRound}
          className={`rounded-full px-6 py-3 font-semibold text-white ${
            selectedIds.length === targetThisRound
              ? "bg-brand hover:opacity-90"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          }`}
        >
          {isFinalRound ? "Finalize" : "Confirm"} ({selectedIds.length}/{targetThisRound})
        </button>
      </div>

      <div className="text-center mt-4 text-sm text-zinc-500">
        {remaining.length} item{remaining.length === 1 ? "" : "s"} available
      </div>

      {list.winnerId && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 font-medium">
            🏆 Final pick: {list.items.find((i) => i.id === list.winnerId)?.title || "Chosen"}
          </div>
        </div>
      )}
    </div>
  );
}
