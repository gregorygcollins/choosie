


"use client";
import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function VirtualNarrowingDiagnosticPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const listId = params?.id as string;

  const handleTestApi = async () => {
    setApiResult(null);
    setApiError(null);
    try {
      const url = new URL(`/api/choosie/narrow/state`, window.location.origin);
      url.searchParams.set("listId", listId);
      // Copy all search params from the URL
      for (const [key, value] of searchParams.entries()) {
        url.searchParams.set(key, value);
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      const data = await res.json();
      setApiResult(data);
    } catch (e: any) {
      setApiError(e?.message || String(e));
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontWeight: 700, fontSize: 24 }}>Virtual narrowing diagnostic page</h1>
      <div style={{ margin: "16px 0" }}>
        <b>listId:</b> {listId}
      </div>
      <div style={{ margin: "16px 0" }}>
        <b>URL search params:</b> {searchParams.toString()}
      </div>
      <button onClick={handleTestApi} style={{ padding: "8px 16px", fontWeight: 600, fontSize: 16 }}>
        Test API
      </button>
      <div style={{ marginTop: 24 }}>
        {apiResult && (
          <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, fontSize: 14 }}>
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        )}
        {apiError && (
          <div style={{ color: "red", marginTop: 8 }}>Error: {apiError}</div>
        )}
      </div>
    </div>
  );
}

  if (!list) {
    return <div className="p-8 text-center text-red-600">Failed to load narrowing session.</div>;
  }

  // If progress/state is missing, session not started
  if (!state) {
    return <div className="p-8 text-center text-zinc-600">Virtual narrowing has not started yet.</div>;
  }

  // Winner UI block removed; handled by redirect above

  // Poll for backend state, but only update selection if not user's turn or round changes
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;
    // Only set loading true on initial mount
    if (isFirstLoad.current) setLoading(true);
    async function fetchState() {
      try {
        const res = await fetch("/api/choosie/getList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: params.id }),
          credentials: "include",
        });
        const data = await res.json();
        // Log and store the API response for diagnostics
        console.log("[Narrow] API response", data);
        setDebugApiResponse(data);
        if (!cancelled) {
          if (!data || !data.ok || !data.list) {
            setList(null);
            setState(undefined);
            setItems([]);
            setWinner(null);
            setLoading(false);
            return;
          }
          // Only update state if changed (shallow compare for main objects)
          setList((prev: any) => (prev !== data.list ? data.list : prev));
          setItems((prev: Item[]) => (JSON.stringify(prev) !== JSON.stringify(data.list.items) ? (Array.isArray(data.list.items) ? data.list.items : []) : prev));
          setWinner((prev: string | null) => (prev !== (data.list.winnerId || null) ? (data.list.winnerId || null) : prev));
          if (data.list.progress) {
            setState((prev: any) => (JSON.stringify(prev) !== JSON.stringify(data.list.progress) ? data.list.progress : prev));
            const backendSelected = (data.list.progress.current?.selectedIds ?? []) as string[];
            const backendRound = data.list.progress.roundIndex ?? 0;
            // On first load, always sync selection
            if (isFirstLoad.current) {
              setSelected([...backendSelected]);
              setLastBackendSelected([...backendSelected]);
              setLastRoundIndex(backendRound);
              isFirstLoad.current = false;
              setLoading(false);
              return;
            }
            // If round changed, sync selection
            if (backendRound !== lastRoundIndex) {
              setSelected([...backendSelected]);
              setLastBackendSelected([...backendSelected]);
              setLastRoundIndex(backendRound);
              setLoading(false);
              return;
            }
            // If not user's turn, always sync selection
            const active = pt === (backendRound % ((data.list.participants || 1) - 1));
            if (!active) {
              setSelected([...backendSelected]);
              setLastBackendSelected([...backendSelected]);
            }
            setLoading(false);
          } else {
            setState(undefined);
            setSelected([]);
            setLastBackendSelected([]);
            setLastRoundIndex(-1);
            setLoading(false);
          }
        }
      } catch (e) {
        console.error("[Narrow] API error", e);
        setList(null);
        setState(undefined);
        setItems([]);
        setWinner(null);
        setLoading(false);
      }
    }
    // Timeout fallback: if loading > 3s, stop loading and show fallback
    timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 3000);
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [params.id]);

  // No additional selection syncing needed; handled in polling above


  // Show debug panel always for now
  const showDebugPanel = true;

  // Error if participant count drops below 2
  let participantError = null;
  if (list && list.participants !== undefined && list.participants < 2) {
    participantError = `Error: Participant count dropped to ${list.participants}. Session cannot proceed.`;
  }

  if (loading) {
    return <div className="p-8 text-center">Loading narrowing session…
      {showDebugPanel && debugApiResponse && (
        <div className="mt-6 p-4 bg-zinc-100 border border-zinc-300 rounded text-left text-xs max-w-2xl mx-auto overflow-x-auto">
          <div className="font-bold mb-1">Debug API Response</div>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(debugApiResponse, null, 2)}</pre>
        </div>
      )}
    </div>;
  }

  if (!list) {
    return <div className="p-8 text-center text-red-600">Failed to load narrowing session.
      {showDebugPanel && debugApiResponse && (
        <div className="mt-6 p-4 bg-zinc-100 border border-zinc-300 rounded text-left text-xs max-w-2xl mx-auto overflow-x-auto">
          <div className="font-bold mb-1">Debug API Response</div>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(debugApiResponse, null, 2)}</pre>
        </div>
      )}
    </div>;
  }

  // If progress/state is missing, session not started
  if (!state) {
    return <div className="p-8 text-center text-zinc-600">Virtual narrowing has not started yet.
      {showDebugPanel && debugApiResponse && (
        <div className="mt-6 p-4 bg-zinc-100 border border-zinc-300 rounded text-left text-xs max-w-2xl mx-auto overflow-x-auto">
          <div className="font-bold mb-1">Debug API Response</div>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(debugApiResponse, null, 2)}</pre>
        </div>
      )}
    </div>;
  }

  // Show participant error if present
  if (participantError) {
    return <div className="p-8 text-center text-red-600">{participantError}
      {showDebugPanel && debugApiResponse && (
        <div className="mt-6 p-4 bg-zinc-100 border border-zinc-300 rounded text-left text-xs max-w-2xl mx-auto overflow-x-auto">
          <div className="font-bold mb-1">Debug API Response</div>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(debugApiResponse, null, 2)}</pre>
        </div>
      )}
    </div>;
  }


  // Selection handler
  function handleSelect(id: string) {
    if (!isActive || submitting) return;
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
      // Submit all selected IDs
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
      // Optimistically disable input until backend confirms
      setSubmitting(false);
    } catch (e: any) {
      setError("Failed to submit selection");
      setSubmitting(false);
    }
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
