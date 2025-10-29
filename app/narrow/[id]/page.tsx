"use client";

import { useEffect, useState } from "react";
import { getList, upsertList } from "@/lib/storage";
import { computeNarrowingPlan } from "@/lib/planner";
import { ChoosieList, ChoosieItem } from "@/components/ListForm";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function NarrowPage() {
  const params = useParams();
  const router = useRouter();
  const [list, setList] = useState<ChoosieList | undefined>();
  const [remainingItems, setRemainingItems] = useState<ChoosieItem[]>([]);
  const [setupMode, setSetupMode] = useState(false);
  const [narrowersChoice, setNarrowersChoice] = useState(3);
  const [currentNarrower, setCurrentNarrower] = useState(1);
  const [tailTargets, setTailTargets] = useState<number[]>([5, 3, 1]);
  const [tailInput, setTailInput] = useState<string>(tailTargets.join(","));

  // round state
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundTargets, setRoundTargets] = useState<number[]>([5, 3, 1]);
  const [history, setHistory] = useState<{
    remainingIds: string[];
    currentNarrower: number;
    round: number;
    selectedIds: string[];
  }[]>([]);

  // planner imported from lib/planner
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    const id = params.id as string;
    const listData = getList(id);
    if (!listData) return;
    setList(listData);

    // resume from progress if available
    if (listData.progress && listData.progress.remainingIds?.length) {
      const remaining = listData.items.filter((it) => listData.progress?.remainingIds.includes(it.id));
      setRemainingItems(remaining);
      setCurrentNarrower(listData.progress.currentNarrower || 1);
      setRoundNumber(listData.progress.round || 1);
      if (listData.progress.history && Array.isArray(listData.progress.history)) {
        // Migrate old history entries that don't have selectedIds
        const migratedHistory = listData.progress.history.map((h: any) => ({
          ...h,
          selectedIds: h.selectedIds || []
        }));
        setHistory(migratedHistory);
      }
      // restore tail/minReduction if present
      if ((listData as any).narrowingTail && Array.isArray((listData as any).narrowingTail)) {
        setTailTargets((listData as any).narrowingTail);
        setTailInput(((listData as any).narrowingTail as number[]).join(","));
      }
      // if a stored narrowingPlan exists, restore it; else compute based on remaining length
      if ((listData as any).narrowingPlan && Array.isArray((listData as any).narrowingPlan)) {
        setRoundTargets((listData as any).narrowingPlan as number[]);
      } else {
        setRoundTargets(
          computeNarrowingPlan(remaining.length, listData.narrowers || narrowersChoice, {
            tail: (listData as any).narrowingTail || tailTargets,
            minReductionFraction: (listData as any).minReductionFraction || 0.2,
          })
        );
      }
    } else {
      // Auto initialize: determine players automatically and start plan
      const estimatePlayers = (l: ChoosieList): number => {
        // If event invitees exist, treat total players as owner + invitees
        const invitees = l.event?.invitees?.length || 0;
        const total = Math.max(2, Math.min(8, (invitees > 0 ? 1 + invitees : 4))); // default to 4 if unknown
        return total;
      };

      const players = listData.narrowers || estimatePlayers(listData);
      const DEFAULT_MIN = (listData as any).minReductionFraction || 0.2;
      const tail = (listData as any).narrowingTail || tailTargets;
      const plan = computeNarrowingPlan(listData.items.length, players, { tail, minReductionFraction: DEFAULT_MIN });

      const updated: ChoosieList = {
        ...listData,
        narrowers: players,
        narrowingPlan: plan,
        narrowingTail: tail,
        minReductionFraction: DEFAULT_MIN,
        progress: {
          remainingIds: listData.items.map((i) => i.id),
          currentNarrower: 1,
          round: 1,
          totalRounds: plan.length,
          history: [],
        },
      };

      upsertList(updated);
      setList(updated);
      setSetupMode(false);
      setRemainingItems(listData.items);
      setCurrentNarrower(1);
      setRoundNumber(1);
      setRoundTargets(plan);
    }
  }, [params.id]);

  // helper to persist progress
  function saveProgress(remainingIds: string[], nextNarrower: number, nextRound: number, newHistory?: typeof history) {
    if (!list) return;
    const updated: ChoosieList = {
      ...list,
      narrowingPlan: roundTargets,
      // also store progress for resume
      progress: {
        remainingIds,
        currentNarrower: nextNarrower,
        round: nextRound,
        totalRounds: roundTargets.length,
        history: newHistory ?? history,
      },
    } as ChoosieList & { narrowingPlan?: number[] };
    upsertList(updated);
    setList(updated);
  }

  // Setup: choose number of players (narrowers)
  const startWithNarrowers = () => {
    if (!list) return;
    // compute an adaptive plan and persist it
    const DEFAULT_MIN = 0.2;
    const plan = computeNarrowingPlan(list.items.length, narrowersChoice, { tail: tailTargets, minReductionFraction: DEFAULT_MIN });
    const updated = {
      ...list,
      narrowers: narrowersChoice,
      narrowingPlan: plan,
      narrowingTail: tailTargets,
      minReductionFraction: DEFAULT_MIN,
    } as ChoosieList;
    // initialize progress with all item ids and starting narrower index 1
  updated.progress = { remainingIds: list.items.map((i) => i.id), currentNarrower: 1, round: 1, totalRounds: plan.length, history: [] };
    // store top-level currentRound for convenience
    (updated as any).currentRound = 0;
    upsertList(updated);
    setList(updated);
    setSetupMode(false);
    setRemainingItems(list.items);
    setCurrentNarrower(1);
    setRoundNumber(1);
    setRoundTargets(plan);
    setHistory([]);
  };

  // toggle selection during a round
  const toggleSelect = (id: string) => {
    const target = roundTargets[roundNumber - 1] ?? 1;
    setSelectedIds((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= target) return s; // limit selections
      return [...s, id];
    });
  };

  // drag and drop reorder
  function reorderInPlace(from: number, to: number) {
    setRemainingItems((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function onDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(index)); } catch {}
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
  function onDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    let from = dragIndex;
    if (from == null) {
      const t = e.dataTransfer.getData("text/plain");
      const p = Number.parseInt(t, 10);
      if (!Number.isNaN(p)) from = p;
    }
    if (from != null) reorderInPlace(from, index);
    setDragIndex(null);
  }

  // confirm selections for this round
  const confirmRound = () => {
    if (!list) return;
    const target = roundTargets[roundNumber - 1] ?? 1;
    if (selectedIds.length !== target) return; // require exact count

    const newRemaining = list.items.filter((it) => selectedIds.includes(it.id));

    // figure out next narrower and round
    const nextRound = roundNumber + 1;
    const numPlayers = list.narrowers || 1;
    const nextNarrower = ((roundNumber) % numPlayers) + 1; // assign based on round index

    // push current snapshot into history and save
    const snapshot = {
      remainingIds: remainingItems.map((i) => i.id),
      currentNarrower,
      round: roundNumber,
      selectedIds: [...selectedIds], // store the selections made in this round
    };
    const newHistory = [...history, snapshot];
    saveProgress(newRemaining.map((i) => i.id), nextNarrower, nextRound, newHistory);

    // update local state
    setRemainingItems(newRemaining);
    setSelectedIds([]);
    setRoundNumber(nextRound);
    setCurrentNarrower(nextNarrower);
    setHistory(newHistory);

    // if final reached, persist winner and navigate to final page
    if (newRemaining.length === 1 || nextRound > roundTargets.length) {
      const winnerId = newRemaining[0]?.id;
      // Keep progress so user can go back through the rounds
      const finalized = { 
        ...list, 
        winnerId,
        progress: {
          remainingIds: newRemaining.map((i) => i.id),
          currentNarrower: nextNarrower,
          round: nextRound,
          totalRounds: roundTargets.length,
          history: newHistory,
        }
      } as ChoosieList;
      upsertList(finalized);
      router.push(`/final/${list.id}`);
    }
  };

  // Undo the last confirmed round
  const undoLast = () => {
    if (!list || history.length === 0) return;
    const prev = history[history.length - 1];
    const newHist = history.slice(0, -1);
    const restoredItems = list.items.filter((it) => prev.remainingIds.includes(it.id));
    setRemainingItems(restoredItems);
    setSelectedIds(prev.selectedIds || []); // restore the selections from that round
    setRoundNumber(prev.round);
    setCurrentNarrower(prev.currentNarrower);
    setHistory(newHist);
    saveProgress(prev.remainingIds, prev.currentNarrower, prev.round, newHist);
  };

  // Reset to the start of the plan
  const resetAll = () => {
    if (!list) return;
    const allIds = list.items.map((i) => i.id);
    setRemainingItems([...list.items]);
    setSelectedIds([]);
    setRoundNumber(1);
    setCurrentNarrower(1);
    setHistory([]);
    saveProgress(allIds, 1, 1, []);
    // also clear any previously determined winner
    const clearedWinner = { ...list, winnerId: undefined } as ChoosieList;
    upsertList(clearedWinner);
  };

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">List Not Found</h1>
        <p className="mb-6 text-zinc-600">We couldn't find the list you're looking for.</p>
        <Link
          href="/"
          className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  // Setup step removed: we auto-initialize based on event invitees or sensible defaults

  const target = roundTargets[Math.max(0, roundNumber - 1)] ?? 1;
  // playful role + message for the next step banner
  const isFinalRound = roundNumber >= roundTargets.length;
  let nextRole = "";
  let nextEmoji = "🎬";
  let nextPhrase = "";
  if (isFinalRound) {
    nextRole = "Decider";
    nextEmoji = "🏆";
    nextPhrase = "choosie your movie!";
  } else if (roundNumber === 1) {
    nextRole = "Curator";
    nextEmoji = "🎨";
    nextPhrase = `choosie your ${target} movie${target > 1 ? "s" : ""}!`;
  } else if (roundNumber === 2) {
    nextRole = "Selector";
    nextEmoji = "🎯";
    nextPhrase = `choosie your ${target} movie${target > 1 ? "s" : ""}!`;
  } else {
    nextRole = `Narrower ${currentNarrower}`;
    nextEmoji = "✨";
    nextPhrase = `choosie your ${target} movie${target > 1 ? "s" : ""}!`;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-2">{list.title}</h1>

      {/* Visual timeline showing round progression */}
      <div className="mb-6 flex flex-col items-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          {roundTargets.map((targetCount, idx) => {
            const isCurrent = idx + 1 === roundNumber;
            const isPast = idx + 1 < roundNumber;
            return (
              <div key={idx} className="flex items-center">
                {idx > 0 && (
                  <div 
                    className={`h-[2px] w-8 mx-1 ${
                      isPast ? "bg-brand" : "bg-zinc-200"
                    }`}
                  />
                )}
                <div
                  className={`
                    flex h-8 min-w-[2rem] items-center justify-center rounded-full px-3
                    text-sm font-medium transition-all
                    ${
                      isCurrent
                        ? "bg-brand text-white ring-4 ring-brand/20"
                        : isPast
                        ? "bg-brand/20 text-brand"
                        : "bg-zinc-100 text-zinc-400"
                    }
                  `}
                >
                  {targetCount}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mb-1 text-zinc-600">
          Round {Math.min(roundNumber, roundTargets.length)} of {roundTargets.length}
        </div>
        {roundNumber === 1 && (
          <p className="text-center mb-2 text-zinc-700">
            Now: identify the <strong>Curator</strong>, the <strong>Selector</strong>, and the <strong>Decider</strong>.
          </p>
        )}
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-brand/20 text-zinc-800">
            <span className="text-lg" aria-hidden>{nextEmoji}</span>
            {roundNumber === 1 ? (
              <>
                <span>{`Next: `}<strong>{nextRole}</strong>{`,`}</span>
                <span className="opacity-80">{nextPhrase}</span>
              </>
            ) : (
              <>
                <span><strong>{nextRole}</strong>{`,`}</span>
                <span className="opacity-80">{nextPhrase}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* moved plan hint above the banner on round 1 */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {remainingItems.map((item, idx) => {
          const selected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, idx)}
              className={`flex flex-col items-start p-4 rounded-2xl bg-white/90 shadow-md transition-transform duration-150 focus:outline-none border-2 ${selected ? 'border-brand scale-105' : 'border-transparent hover:scale-102'}`}
            >
              <div className="w-full flex justify-end mb-1">
                <div className="cursor-grab text-zinc-400" title="Drag to reorder" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                  </svg>
                </div>
              </div>
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-36 object-cover rounded-md mb-3" />
              ) : (
                <div className="w-full h-36 rounded-md bg-white/60 mb-3 flex items-center justify-center text-zinc-400">📷</div>
              )}
              <div className="font-semibold">{item.title}</div>
              {item.notes && <div className="text-sm text-zinc-500">{item.notes}</div>}
              <div className="mt-2 text-sm text-zinc-500">{selected ? `Selected (${selectedIds.indexOf(item.id) + 1})` : 'Tap to select'}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={undoLast}
          disabled={history.length === 0}
          aria-label="Go back to previous round"
          className={`rounded-full px-6 py-3 text-sm ${history.length === 0 ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-white/70 text-zinc-700 hover:bg-white'}`}
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
          onClick={() => {
            // allow skipping backwards to list view
            router.push(`/list/${list.id}`);
          }}
          className="rounded-full bg-zinc-100 px-6 py-3 text-zinc-700"
        >
          Back to watchlist
        </button>

        <button
          onClick={confirmRound}
          disabled={selectedIds.length !== target}
          className={`rounded-full px-6 py-3 font-semibold text-white ${selectedIds.length === target ? 'bg-brand hover:opacity-90' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
        >
          Confirm ({selectedIds.length}/{target})
        </button>
      </div>

      <div className="text-center mt-4 text-sm text-zinc-500">{remainingItems.length} items available</div>
    </div>
  );
}
