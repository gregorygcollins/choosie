"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Item = { id: string; title: string; notes?: string; image?: string | null };

export default function VirtualNarrowingSession() {
  const params = useParams();
  const search = useSearchParams();
  const pt = Number(search.get("pt") || 0);
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch session state (polling for simplicity)
  useEffect(() => {
    let cancelled = false;
    async function fetchState() {
      setLoading(true);
      try {
        const res = await fetch("/api/choosie/getList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: params.id }),
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled && data.ok) {
          setList(data.list);
          setState(data.list.progress || {});
          setItems(data.list.items || []);
          setWinner(data.list.winnerId || null);
        }
      } catch {}
      setLoading(false);
    }
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [params.id]);

  // Update selectedIds from state
  useEffect(() => {
    if (state && Array.isArray(state.current?.selectedIds)) {
      setSelected([...state.current.selectedIds]);
    }
  }, [state]);

  if (loading) {
    return <div className="p-8 text-center">Loading narrowing session…</div>;
  }

  if (!list || !state) {
    return <div className="p-8 text-center text-red-600">Failed to load narrowing session.</div>;
  }

  // Determine turn logic
  const participants = list.participants || 1;
  const roundIndex = state.roundIndex || 0;
  const plan = state.plan || [1];
  const target = plan[roundIndex] || 1;
  const remainingIds: string[] = state.current?.remainingIds || [];
  const isActive = pt === ((roundIndex) % (participants - 1));

  // Winner
  if (winner) {
    const winnerItem = items.find(i => i.id === winner);
    return (
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Narrowing Complete!</h1>
        <div className="mb-4">Winner:</div>
        <div className="p-4 bg-green-50 border border-green-200 rounded text-xl font-semibold">
          {winnerItem ? winnerItem.title : winner}
        </div>
      </div>
    );
  }

  // Selection handler
  function handleSelect(id: string) {
    if (!isActive) return;
    let next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    if (next.length > target) next = next.slice(0, target);
    setSelected(next);
  }

  // Submit selection
  async function submitSelection() {
    setSubmitting(true);
    setError(null);
    try {
      for (const id of selected) {
        await fetch("/api/choosie/narrow/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: params.id, itemId: id, participantToken: "virtual" }),
        });
      }
      // Confirm round if selection count matches target
      if (selected.length === target) {
        await fetch("/api/choosie/narrow/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: params.id, participantToken: "virtual" }),
        });
      }
    } catch (e: any) {
      setError("Failed to submit selection");
    }
    setSubmitting(false);
  }

  // Show remaining items in the order they appear in the original list
  const remainingItems = items.filter((item) => remainingIds.includes(item.id));

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Virtual Narrowing Session</h1>
      <div className="mb-2">Round: <span className="font-mono">{roundIndex + 1}</span> / {plan.length}</div>
      <div className="mb-2">Your participant index: <span className="font-mono">{pt}</span></div>
      <div className="mb-2">Select <b>{target}</b> item{target > 1 ? 's' : ''} from the remaining list:</div>
      <ul className="mb-6">
        {remainingItems.map((item) => (
          <li key={item.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              disabled={!isActive || submitting}
              onChange={() => handleSelect(item.id)}
              className="mr-2"
            />
            <span>{item.title}</span>
          </li>
        ))}
      </ul>
      {isActive ? (
        <button
          className="px-4 py-2 rounded bg-brand text-white font-semibold disabled:opacity-60"
          disabled={selected.length !== target || submitting}
          onClick={submitSelection}
        >
          {submitting ? "Submitting..." : `Submit Selection (${selected.length}/${target})`}
        </button>
      ) : (
        <div className="text-zinc-500 mb-2">Waiting for other participant's turn…</div>
      )}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
