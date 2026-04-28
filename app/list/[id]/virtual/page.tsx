"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
function VirtualInvitesPageContent() {
    const [state, setState] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
  const { id } = useParams();
  const router = useRouter();
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[NARROW DEBUG] route param id:', id);
  }

  // Defensive: check state shape
  const round = typeof state?.roundIndex === 'number' ? state.roundIndex : 0;
  const currentTarget = state?.current?.target ?? 1;
  const remainingItems = Array.isArray(state?.current?.remainingIds) ? items.filter((i) => state.current.remainingIds.includes(i.id)) : [];
  const selectedItems = Array.isArray(state?.current?.selectedIds) ? items.filter((i) => state.current.selectedIds.includes(i.id)) : [];

  // Get participant index from URL (?pt=)
  let participantIndex = 0;
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const pt = urlParams.get("pt");
    if (pt && !isNaN(Number(pt))) participantIndex = Number(pt);
  }

  // Selection state for this participant
  const [mySelections, setMySelections] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Handler for selecting/deselecting items
  const handleSelect = (itemId: string) => {
    setMySelections((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        if (prev.length < currentTarget) {
          return [...prev, itemId];
        } else {
          return prev; // do not exceed target
        }
      }
    });
  } // End handleSelect

  // Fetch narrowing state and items
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchState() {
      try {
        const res = await fetch('/api/choosie/narrow/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listId: id }),
          credentials: 'include',
        });
        const data = await res.json();
        if (!cancelled && data.ok) {
          setState(data.state);
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch narrowing state', e);
      }
    }
    fetchState();
    const interval = setInterval(fetchState, 3000); // Poll every 3s
    return () => { cancelled = true; clearInterval(interval); };
  }, [id]);

  // Defensive: loading state
  if (!state || !items.length) {
    return <div className="p-8 text-center text-zinc-500">Loading narrowing session…</div>;
  }

  // Determine if this participant is active
  const activeRole = state?.plan?.[state.roundIndex]?.role;
  const myRole = state?.participants?.[participantIndex]?.role;
  const isActive = myRole && myRole === activeRole;

  // Winner
  if (state.winnerItemId) {
    const winner = items.find((i) => i.id === state.winnerItemId);
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Winner: {winner?.title || 'Chosen'}</h2>
        {winner?.image && <img src={winner.image} alt={winner.title} className="mx-auto rounded-lg max-h-48 mb-4" />}
        <div className="text-lg text-green-700 font-semibold mb-2">🎉 Congratulations! 🎉</div>
      </div>
    );
  }

  // Main narrowing UI
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-2">Virtual Narrowing – Step {state.roundIndex + 1} of {state.plan?.length || '?'}</h1>
      <div className="mb-4 text-zinc-600 text-sm">Role: <b>{myRole || 'Participant'}</b> {isActive ? '(Your turn)' : ''}</div>
      {isActive ? (
        <>
          <div className="mb-4">Select up to {currentTarget} item(s):</div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {remainingItems.map((item) => (
              <li key={item.id} className={`rounded border p-2 flex flex-col items-center cursor-pointer ${mySelections.includes(item.id) ? 'bg-brand/10 border-brand' : ''}`}
                  onClick={() => handleSelect(item.id)}
              >
                {item.image && <img src={item.image} alt={item.title} className="w-20 h-28 object-cover rounded mb-1" />}
                <div className="font-medium">{item.title}</div>
                {item.notes && <div className="text-xs text-zinc-500 mt-1">{item.notes}</div>}
                <div className="mt-2">
                  <input
                    type="checkbox"
                    checked={mySelections.includes(item.id)}
                    readOnly
                    className="accent-brand"
                    tabIndex={-1}
                  />
                </div>
              </li>
            ))}
          </ul>
          {submitError && <div className="text-red-600 text-sm mb-2">{submitError}</div>}
          <button
            onClick={async () => {
              if (mySelections.length === 0 || mySelections.length > currentTarget) {
                setSubmitError(`Please select up to ${currentTarget} item(s).`);
                return;
              }
              setSubmitError(null);
              setSubmitting(true);
              try {
                const res = await fetch('/api/choosie/narrow/submit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    listId: id,
                    selections: mySelections,
                    participantIndex,
                  }),
                });
                if (res.ok) {
                  window.location.reload();
                } else {
                  setSubmitError('Failed to submit selections. Try again.');
                }
              } catch {
                setSubmitError('Failed to submit selections. Try again.');
              }
              setSubmitting(false);
            }}
            disabled={submitting}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 mt-2 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Selections'}
          </button>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center mt-8">
          <div className="text-3xl mb-4">😎</div>
          <div className="text-xl font-bold mb-2">Please wait for your turn!</div>
          <div className="text-zinc-700 mb-4">Refresh this page to see progress as the narrowing continues.</div>
        </div>
      )}
    </div>
  );
}

export default function VirtualInvitesPage() {
  return (
    <ErrorBoundary>
      <VirtualInvitesPageContent />
    </ErrorBoundary>
  );
}
