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

    "use client";
    import { useState, useEffect } from "react";
    import { useRouter } from "next/navigation";
    import { useParams, useSearchParams } from "next/navigation";

    export default function VirtualNarrowingPage() {
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

      // Redirect to winner page if winnerItemId is present
      useEffect(() => {
        if (api?.winnerItemId && listId) {
          router.replace(`/final/${listId}?winner=${api.winnerItemId}`);
        }
      }, [api?.winnerItemId, listId, router]);

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
          await fetchState();
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

      return (
        <main className="min-h-screen px-6 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
            <h1 className="mb-4 text-2xl font-bold">Virtual Narrowing</h1>
            {error && <div className="text-red-600 mb-4">{error}</div>}
            {loading && <div className="text-zinc-500 mb-4">Loading narrowing session…</div>}
            {state && (
              <>
                <div className="mb-2 text-lg font-semibold">Round {roundIndex + 1}</div>
                <div className="mb-4 text-zinc-700">Choose {target} movie{target > 1 ? "s" : ""}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {remainingItems.map((item: any) => (
                    <div
                      key={item.id}
                      className={`rounded-lg border border-zinc-200 p-4 flex flex-col items-start gap-2 cursor-pointer hover:bg-zinc-50 ${selected.includes(item.id) ? "ring-2 ring-blue-400" : ""}`}
                      onClick={() => handleSelect(item.id)}
                      tabIndex={0}
                      aria-label={`Select ${item.title}`}
                    >
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-full h-32 object-cover rounded mb-2" />
                      )}
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
                  {submitting ? "Submitting..." : `Submit selections (${selected.length}/${target})`}
                </button>
              </>
            )}
          </div>
        </main>
      );
    }
