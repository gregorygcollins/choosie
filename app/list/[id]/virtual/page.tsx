"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams, useSearchParams } from "next/navigation";

export default function VirtualInvitesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const listId = String(params?.id ?? "");
  const queryString = searchParams.toString();
  // Read participantToken from ?pt=... in the URL
  const participantToken = searchParams.get("pt") || "";

  // State for narrowing session
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string>("");


  // Fetch narrowing state on mount
  useEffect(() => {
    fetchState();
    // eslint-disable-next-line
  }, [listId]);

  // Redirect to winner page if winnerItemId is present
  useEffect(() => {
    if (session?.winnerItemId && listId) {
      router.replace(`/final/${listId}?winner=${session.winnerItemId}`);
    }
  }, [session?.winnerItemId, listId, router]);

  async function fetchState() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/choosie/narrow/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, query: queryString }),
      });
      const data = await res.json();
      console.log('[Virtual Narrowing] fetchState result:', data);
      if (!data.ok) throw new Error(data.body || "Unknown error");
      setSession(data);
      setSelected(data.state?.current?.selectedIds || []);
    } catch (e: any) {
      setError(e.message || "Failed to load narrowing session");
    } finally {
      setLoading(false);
    }
  }

  // Handle item selection
  function handleSelect(id: string) {
    if (submitting) return;
    let next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    const target = session?.state?.current?.target || 1;
    if (next.length > target) next = next.slice(0, target);
    setSelected(next);
  }

  // Submit selection
  async function submitSelection() {
    if (!session) return;
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
      if (selected.length === (session.state?.current?.target || 1)) {
        await fetch("/api/choosie/narrow/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId, participantToken }),
        });
        // Wait briefly to ensure backend persists winner
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      setResult("Selection submitted.");
      await fetchState();
    } catch (e: any) {
      setError("Failed to submit selection");
    } finally {
      setSubmitting(false);
    }
  }

  // Render

  const items = session?.items || [];
  const current = session?.state?.current;
  const target = current?.target || 1;
  // Try to get the list name from the first item, fallback to generic if not found
  const listName = session?.list?.name || items[0]?.listName || "Narrowing Session";

  return (
    <main className="min-h-screen px-6 py-12">

      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-4 text-3xl font-bold">{listName}</h1>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading && <div className="text-zinc-500 mb-4">Loading narrowing session…</div>}

        {/* Items List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {items.map((item: any) => (
            <div
              key={item.id}
              className={`rounded-lg border border-zinc-200 p-4 flex flex-col items-start gap-2 cursor-pointer hover:bg-zinc-50 ${selected.includes(item.id) ? "ring-2 ring-blue-400" : ""}`}
              onClick={() => handleSelect(item.id)}
              tabIndex={0}
              aria-label={`Select ${item.title}`}
            >
              <img src={item.image} alt={item.title} className="w-full h-32 object-cover rounded mb-2" />
              <div className="font-semibold">{item.title}</div>
              <div className="text-xs text-zinc-600">{item.notes}</div>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                readOnly
                className="mt-2"
              />
            </div>
          ))}
        </div>

        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
          disabled={selected.length !== target || submitting}
          onClick={submitSelection}
        >
          {submitting ? "Submitting..." : `Submit Selection (${selected.length}/${target})`}
        </button>

        {result && <div className="mt-4 text-green-700">{result}</div>}

        {/* Debug: raw API response */}
        <details className="mt-8">
          <summary className="cursor-pointer text-xs text-zinc-500">Show raw API response</summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
      </div>
    </main>
  );
}
