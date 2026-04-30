"use client";
import { useState, useEffect, useRef } from "react";
import { NarrowingSelector } from "@/components/NarrowingSelector";
import { getList } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useParams, useSearchParams } from "next/navigation";

export default function VirtualInvitesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const listId = String(params?.id ?? "");
  const participantToken = searchParams.get("pt") || "";
  // Accept numeric pt for virtual narrowing (Decider/roles), or strong token for invitee flows
  const participantTokenValid =
    participantToken.length >= 16 ||
    (/^\d+$/.test(participantToken) && Number(participantToken) >= 0 && Number.isFinite(Number(participantToken)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [api, setApi] = useState<any>(null);
  const [listTitle, setListTitle] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [infoModalItem, setInfoModalItem] = useState<any>(null);

  // Fetch narrowing state on mount and after submit
  // Track if user is actively selecting or submitting
  const isActiveRef = useRef(false);

  // Fetch narrowing state and latest list title
  async function fetchState(force = false) {
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
      // Only update selection from server if not actively selecting/submitting or forced
      if (!isActiveRef.current || force) {
        setSelected(data.state?.current?.selectedIds || []);
      }
      // Always use the backend list title if available
      let latestTitle = data?.list?.title;
      if (!latestTitle) {
        const localList = getList(listId);
        latestTitle = localList?.title || "Narrow Virtually";
      }
      setListTitle(latestTitle);
    } catch (e: any) {
      setError("Failed to load narrowing session");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // If no valid pt, redirect to roles page (for multi-narrower virtual)
    if (!participantTokenValid) {
      router.replace(`/list/${listId}/virtual/roles`);
      return;
    }
    fetchState(true); // force initial fetch
    let interval = setInterval(() => {
      if (!isActiveRef.current) fetchState();
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [listId, participantTokenValid]);

  // Remove winner redirect effect; handled in fetchState

  // Use shared NarrowingSelector logic
  const handleSelect = (itemIds: string[]) => {
    setSelected(itemIds);
  };

  // Submit selection
  async function submitSelection() {
    if (!api) return;
    if (!participantTokenValid) {
      setError("Missing or invalid participant token. Please claim a role or use your invite link.");
      return;
    }
    setSubmitting(true);
    setError("");
    isActiveRef.current = true;
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
      await fetchState(true); // Force update after submit
    } catch (e: any) {
      setError("Failed to submit selection");
    } finally {
      setSubmitting(false);
      isActiveRef.current = false;
    }
  }

  // Render
  const state = api?.state;
  const items = api?.items || [];
  const roundIndex = state?.roundIndex ?? 0;
  const target = state?.current?.target || 1;
  const remainingIds = state?.current?.remainingIds || [];
  const remainingItems = items.filter((item: any) => remainingIds.includes(item.id));
  // listTitle is now always up-to-date
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
          <h1 className="text-2xl font-bold mb-6">{listTitle}</h1>
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
            {/* Sleek grid icon (matches In Person) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <rect x="3" y="3" width="7" height="7" rx="2" fill={viewMode === 'grid' ? '#fff' : 'none'} stroke="currentColor" strokeWidth="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill={viewMode === 'grid' ? '#fff' : 'none'} stroke="currentColor" strokeWidth="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill={viewMode === 'grid' ? '#fff' : 'none'} stroke="currentColor" strokeWidth="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill={viewMode === 'grid' ? '#fff' : 'none'} stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            aria-label="List View"
            className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-700'}`}
            onClick={() => setViewMode('list')}
          >
            {/* Sleek list icon (matches In Person) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <rect x="4" y="5" width="16" height="2" rx="1" fill={viewMode === 'list' ? '#fff' : 'none'} stroke="currentColor" strokeWidth="1.5" />
              <rect x="4" y="11" width="16" height="2" rx="1" fill={viewMode === 'list' ? '#fff' : 'none'} stroke="currentColor" strokeWidth="1.5" />
              <rect x="4" y="17" width="16" height="2" rx="1" fill={viewMode === 'list' ? '#fff' : 'none'} stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        <NarrowingSelector
          step={{
            title: `Select ${target} item(s)`,
            items: remainingItems.map((item: any) => ({ id: item.id, name: item.title })),
          }}
          selections={{ ["virtualNarrower"]: selected }}
          participantId="virtualNarrower"
          onSelect={handleSelect}
          disabled={selected.length >= target}
        />
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
          disabled={selected.length !== target || submitting || !participantTokenValid}
          onClick={submitSelection}
        >
          {submitting ? 'Submitting...' : `Confirm (${selected.length}/${target})`}
        </button>
        {!participantTokenValid && (
          <div className="text-red-500 mt-2 text-center">
            Missing or invalid participant token. Please claim a role or use your invite link.
          </div>
        )}
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

        {/* Undo and Reset list buttons at the bottom, matching In Person UI */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <button
            onClick={handleUndo}
            disabled={submitting}
            className="rounded-full px-6 py-3 font-semibold transition-colors ring-1 bg-white text-blue-600 ring-blue-200 hover:bg-blue-50 disabled:opacity-60"
          >
            Undo
          </button>
          <button
            onClick={handleReset}
            disabled={submitting}
            className="rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:opacity-90 transition-colors disabled:opacity-60"
          >
            Reset list
          </button>
        </div>
      </div>
    </main>
  );
}
