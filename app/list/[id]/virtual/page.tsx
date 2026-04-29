"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams, useSearchParams } from "next/navigation";

export default function VirtualInvitesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const listId = String(params?.id ?? "");
  const participantToken = searchParams.get("pt") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [api, setApi] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [infoModalItem, setInfoModalItem] = useState<any>(null);

  // Fetch narrowing state on mount and after submit
  async function fetchState() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/choosie/narrow/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
      });
      const data = await res.json();
      setApi(data);
      setSelected(data.state?.current?.selectedIds || []);
      // No redirect; winner UI is rendered inline to match In Person experience
    } catch (e: any) {
      setError("Failed to load narrowing session");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchState();
    // eslint-disable-next-line
  }, [listId]);

  // Remove winner redirect effect; handled in fetchState

  // Handle item selection
  function handleSelect(id: string) {
    if (submitting) return;
    let next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    const target = api?.state?.current?.target || 1;
    if (next.length > target) next = next.slice(0, target);
    setSelected(next);
  }

  // Submit selection
  async function submitSelection() {
    if (!api) return;
    setSubmitting(true);
    setError("");
    try {
      // Submit all selected IDs
      for (const id of selected) {
        await fetch("/api/choosie/narrow/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId, itemId: id, participantToken }),
        });
      }
      // Confirm round if selection count matches target
      if (selected.length === (api.state?.current?.target || 1)) {
        await fetch("/api/choosie/narrow/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId, participantToken }),
        });
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      await fetchState(); // This will log winnerItemId and redirect if present
    } catch (e: any) {
      setError("Failed to submit selection");
    } finally {
      setSubmitting(false);
    }
  }

  // Render
  const state = api?.state;
  const items = api?.items || [];
  const roundIndex = state?.roundIndex ?? 0;
  const target = state?.current?.target || 1;
  const remainingIds = state?.current?.remainingIds || [];
  const remainingItems = items.filter((item: any) => remainingIds.includes(item.id));
  const listTitle = api?.list?.title || "Narrow Virtually";
  const winnerId = api?.winnerItemId;
  const winner = items.find((i: any) => i.id === winnerId);

  // Undo last narrowing action
  async function handleUndo() {
    setSubmitting(true);
    setError("");
    try {
      await fetch("/api/choosie/narrow/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, participantToken }),
      });
      await fetchState();
    } catch (e: any) {
      setError("Failed to undo");
    } finally {
      setSubmitting(false);
    }
  }

  // Reset the narrowing session
  async function handleReset() {
    setSubmitting(true);
    setError("");
    try {
      await fetch(`/api/choosie/narrow/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, participantToken }),
      });
      await fetchState();
    } catch (e: any) {
      setError("Failed to reset list");
    } finally {
      setSubmitting(false);
    }
  }

  if (winnerId && winner) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 text-6xl animate-bounce">🎉</div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {winner.image && (
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-md">
                <img src={winner.image} alt={winner.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="mb-3 text-amber-600 font-semibold text-lg">🏆 We have a winner! 🏆</div>
            <div className="text-3xl font-bold text-zinc-800 mb-3">{winner.title}</div>
            {winner.notes && (<div className="text-sm text-zinc-600 mb-6">{winner.notes}</div>)}
            <div className="flex items-center justify-center gap-2 text-amber-500 mb-6">
              <span className="text-2xl">⭐</span>
              <span className="text-2xl">⭐</span>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={handleUndo} disabled={submitting} className="rounded-full px-6 py-3 font-semibold transition-colors ring-1 bg-white text-blue-600 ring-blue-200 hover:bg-blue-50 disabled:opacity-60">Undo</button>
              <button onClick={handleReset} disabled={submitting} className="rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:opacity-90 transition-colors disabled:opacity-60">Reset list</button>
            </div>
            {error && <div className="text-red-500 mt-4">{error}</div>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-6">{listTitle}</h1>
        <div className="mb-4 flex justify-center gap-2">
          <button
            aria-label="Grid View"
            className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-700'}`}
            onClick={() => setViewMode('grid')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <rect x="3" y="3" width="7" height="7" rx="2" className={viewMode === 'grid' ? 'fill-white' : ''}/>
              <rect x="14" y="3" width="7" height="7" rx="2" className={viewMode === 'grid' ? 'fill-white' : ''}/>
              <rect x="14" y="14" width="7" height="7" rx="2" className={viewMode === 'grid' ? 'fill-white' : ''}/>
              <rect x="3" y="14" width="7" height="7" rx="2" className={viewMode === 'grid' ? 'fill-white' : ''}/>
            </svg>
          </button>
          <button
            aria-label="List View"
            className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-700'}`}
            onClick={() => setViewMode('list')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <rect x="4" y="5" width="16" height="2" rx="1" className={viewMode === 'list' ? 'fill-white' : ''}/>
              <rect x="4" y="11" width="16" height="2" rx="1" className={viewMode === 'list' ? 'fill-white' : ''}/>
              <rect x="4" y="17" width="16" height="2" rx="1" className={viewMode === 'list' ? 'fill-white' : ''}/>
            </svg>
          </button>
        </div>
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4 mb-6' : 'flex flex-col gap-2 w-full max-w-2xl mx-auto mb-6'}>
          {remainingItems.map((item: any) => (
            <div
              key={item.id}
              className={`border rounded-xl p-4 shadow-sm cursor-pointer transition-all ${selected.includes(item.id) ? 'ring-2 ring-blue-600' : 'hover:ring-1 hover:ring-blue-400/50'}`}
              onClick={() => handleSelect(item.id)}
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
                  {item.notes && <div className="text-xs text-zinc-600 mt-1">{item.notes}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
          disabled={selected.length !== target || submitting}
          onClick={submitSelection}
        >
          {submitting ? 'Submitting...' : `Confirm (${selected.length}/${target})`}
        </button>
        {infoModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setInfoModalItem(null)}>
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center relative" onClick={e => e.stopPropagation()}>
              <div className="text-2xl font-bold mb-2">{infoModalItem.title}</div>
              {infoModalItem.image && <img src={infoModalItem.image} alt={infoModalItem.title} className="w-32 h-32 object-cover rounded mx-auto mb-4" />}
              <div className="text-zinc-700 mb-4">{infoModalItem.notes}</div>
              <button className="rounded-full bg-blue-600 px-6 py-2 text-white font-semibold hover:opacity-90 transition-colors" onClick={() => setInfoModalItem(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
