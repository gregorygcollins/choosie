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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [previewItem, setPreviewItem] = useState<Item | null>(null);

  // Determine turn logic (must be above hooks that use isActive)
  const participants = list?.participants || 1;
  const roundIndex = state?.roundIndex || 0;
  const plan = state?.plan || [1];
  const target = plan[roundIndex] || 1;
  const remainingIds: string[] = state?.current?.remainingIds || [];
  const isActive = pt === ((roundIndex) % (participants - 1));

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

  // Update selectedIds from state, but preserve local selection during user's turn unless round or backend selection changes
  const [lastRoundIndex, setLastRoundIndex] = useState<number>(-1);
  useEffect(() => {
    if (!state || !Array.isArray(state.current?.selectedIds)) return;
    const backendSelected = state.current.selectedIds as string[];
    const currentRound = state.roundIndex || 0;

    // Always sync if it's not the user's turn
    if (!isActive) {
      setSelected([...backendSelected]);
      setLastRoundIndex(currentRound);
      return;
    }

    // If round changed, sync selection and reset local selection
    if (currentRound !== lastRoundIndex) {
      setSelected([...backendSelected]);
      setLastRoundIndex(currentRound);
      return;
    }

    // If it's user's turn and local selection is empty, sync from backend
    if (selected.length === 0 && backendSelected.length > 0) {
      setSelected([...backendSelected]);
      return;
    }

    // Otherwise, preserve local selection during user's turn
    // Do not update selected from backend if user has already made a selection
  }, [state, isActive]);

  if (loading) {
    return <div className="p-8 text-center">Loading narrowing session…</div>;
  }

  if (!list || !state) {
    return <div className="p-8 text-center text-red-600">Failed to load narrowing session.</div>;
  }

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
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Virtual Narrowing Session</h1>
      <div className="mb-2">Round: <span className="font-mono">{roundIndex + 1}</span> / {plan.length}</div>
      <div className="mb-2">Your participant index: <span className="font-mono">{pt}</span></div>
      <div className="mb-2">Select <b>{target}</b> item{target > 1 ? 's' : ''} from the remaining list:</div>

      {/* List/Grid Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          title="List view"
          aria-pressed={viewMode === "list"}
          onClick={() => setViewMode("list")}
          className={`p-1 rounded-md ${viewMode === "list" ? "bg-zinc-200 shadow" : "hover:bg-zinc-100"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.125 1.125 0 0 1 0 2.25H5.625a1.125 1.125 0 0 1 0-2.25Z" />
          </svg>
        </button>
        <button
          type="button"
          title="Grid view"
          aria-pressed={viewMode === "grid"}
          onClick={() => setViewMode("grid")}
          className={`p-1 rounded-md ${viewMode === "grid" ? "bg-zinc-200 shadow" : "hover:bg-zinc-100"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
        </button>
      </div>

      {viewMode === "list" ? (
        <ul className="space-y-2 mb-6">
          {remainingItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2 cursor-pointer hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand/40"
              role="button"
              tabIndex={0}
              aria-label={`Preview ${item.title}`}
              onClick={() => setPreviewItem(item)}
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  disabled={!isActive || submitting}
                  onChange={e => { e.stopPropagation(); handleSelect(item.id); }}
                  className="mr-2"
                />
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-16 h-16 rounded-md object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-400">📷</div>
                )}
                <div>
                  <div className="font-medium">{item.title}</div>
                  {item.notes && (
                    <div className="text-sm text-zinc-500">{item.notes}</div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {remainingItems.map((item) => (
            <div
              key={item.id}
              className={`relative rounded-lg border border-zinc-200 p-2 flex flex-col items-center cursor-pointer hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand/40 ${selected.includes(item.id) ? 'ring-2 ring-brand' : ''}`}
              tabIndex={0}
              aria-label={`Preview ${item.title}`}
              onClick={() => setPreviewItem(item)}
            >
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                disabled={!isActive || submitting}
                onChange={e => { e.stopPropagation(); handleSelect(item.id); }}
                className="absolute top-2 left-2 z-10"
              />
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-32 object-cover rounded-md mb-2" />
              ) : (
                <div className="w-full h-32 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">📷</div>
              )}
              <div className="font-medium text-center w-full truncate">{item.title}</div>
              {item.notes && (
                <div className="text-xs text-zinc-500 text-center w-full truncate">{item.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
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

      {/* Item Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn"
          onClick={() => setPreviewItem(null)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="item-preview-title"
        >
          <div
            id="item-preview-modal"
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden focus:outline-none"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start p-5 pb-3">
              <h2 id="item-preview-title" className="text-xl font-semibold pr-6">
                {previewItem.title}
              </h2>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/40 rounded-md p-1"
                aria-label="Close preview"
                autoFocus
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
            {previewItem.image && (
              <div className="px-5">
                <img src={previewItem.image} alt={previewItem.title} className="w-full max-h-80 object-cover rounded-lg" />
              </div>
            )}
            <div className="p-5 pt-4 space-y-4">
              {previewItem.notes ? (
                <p className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
                  {previewItem.notes}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic">No notes provided.</p>
              )}
              <div className="flex justify-end gap-3">
                {isActive && (
                  <button
                    onClick={() => {
                      handleSelect(previewItem.id);
                      setPreviewItem(null);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/40 ${selected.includes(previewItem.id)
                      ? 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
                      : 'bg-brand text-white hover:bg-brand/90'}`}
                    disabled={submitting}
                  >
                    {selected.includes(previewItem.id) ? 'Deselect' : 'Select'}
                  </button>
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
