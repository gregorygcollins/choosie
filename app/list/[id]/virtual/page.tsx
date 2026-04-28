"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Item = { id: string; title: string; notes?: string; image?: string | null };

type NarrowState = {
  plan: number[];
  roundIndex: number;
  rounds: any[];
  current: { remainingIds: string[]; selectedIds: string[]; target: number };
};

export default function VirtualInvitesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listTitle, setListTitle] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<NarrowState | null>(null);
  const [winner, setWinner] = useState<Item | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    setLoading(true);
    setError(null);
    fetch(`/api/choosie/narrow/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: id }),
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("List not found or unauthorized");
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setListTitle(data.state?.title || data.title || "List");
        setItems(data.items || []);
        setState(data.state || null);
        if (data.winnerItemId) {
          setWinner(data.items.find((i: any) => i.id === data.winnerItemId) || null);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Failed to load session");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-zinc-700">
          <p className="text-xl">Loading session…</p>
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-rose-700">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push("/lists")}
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors"
          >
            Back to lists
          </button>
        </div>
      </main>
    );
  }
  if (!state) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-zinc-700">
          <p className="text-xl mb-4">Session not found or not started.</p>
          <button
            onClick={() => router.push("/lists")}
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors"
          >
            Back to lists
          </button>
        </div>
      </main>
    );
  }

  // Determine current step and available choices
  const round = state.roundIndex;
  const currentTarget = state.current.target;
  const remainingItems = items.filter((i) => state.current.remainingIds.includes(i.id));
  const selectedItems = items.filter((i) => state.current.selectedIds.includes(i.id));

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-2">{listTitle}</h1>
        <div className="mb-4 text-zinc-600 text-sm">Virtual Narrowing – Step {round + 1} of {state.plan.length}</div>
        {winner ? (
          <div className="my-8">
            <h2 className="text-xl font-semibold mb-2 text-green-700">Final Selection</h2>
            <div className="font-bold text-lg mb-2">{winner.title}</div>
            {winner.image && <img src={winner.image} alt={winner.title} className="mx-auto rounded-lg max-h-48" />}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="font-semibold mb-1">Current Choices ({remainingItems.length}):</div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {remainingItems.map((item) => (
                  <li key={item.id} className="rounded border p-2 flex flex-col items-center">
                    {item.image && <img src={item.image} alt={item.title} className="w-20 h-28 object-cover rounded mb-1" />}
                    <div className="font-medium">{item.title}</div>
                    {item.notes && <div className="text-xs text-zinc-500 mt-1">{item.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-2 text-zinc-500 text-xs">Select up to {currentTarget} for this round.</div>
            {/* TODO: Add participant/role info, selection UI, and action buttons here */}
          </>
        )}
        <button
          onClick={() => router.push(`/list/${id}`)}
          className="mt-6 rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Back to list
        </button>
      </div>
    </main>
  );
}
