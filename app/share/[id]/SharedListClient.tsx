"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SharedItem = {
  id: string;
  title: string;
  notes?: string | null;
  image?: string | null;
};

type SharedList = {
  id: string;
  title: string;
  moduleType: string;
  items: SharedItem[];
  winnerItemId?: string | null;
};

function EmptyImage() {
  return (
    <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-zinc-100 text-2xl text-zinc-400">
      +
    </div>
  );
}

export default function SharedListClient({ listId, token }: { listId: string; token: string }) {
  const [list, setList] = useState<SharedList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSharedList() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/choosie/public/getList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId, token }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok || !data?.list) {
          throw new Error(data?.error || "This shared list is not available.");
        }
        if (!cancelled) setList(data.list);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "This shared list is not available.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSharedList();
    return () => {
      cancelled = true;
    };
  }, [listId, token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-light p-6">
        <p className="text-lg font-semibold text-brand">Loading shared list...</p>
      </main>
    );
  }

  if (error || !list) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-light p-6">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-brand">List unavailable</h1>
          <p className="mt-3 text-sm text-zinc-600">{error || "This share link is invalid or has been turned off."}</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Go home
          </Link>
        </section>
      </main>
    );
  }

  const winner = list.items.find((item) => item.id === list.winnerItemId);

  return (
    <main className="min-h-screen bg-brand-light p-6 sm:p-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-consensus-dark">Shared Choosie list</p>
            <h1 className="mt-2 text-3xl font-semibold text-brand sm:text-4xl">{list.title}</h1>
            <p className="mt-2 text-sm text-zinc-600">
              {list.items.length} {list.items.length === 1 ? "option" : "options"}
              {winner ? `, winner: ${winner.title}` : ""}
            </p>
          </div>
          <Link
            href="/new"
            className="inline-flex w-fit rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Create a list
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.items.map((item) => {
            const isWinner = item.id === list.winnerItemId;
            return (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-soft ${
                  isWinner ? "border-consensus ring-2 ring-consensus/30" : "border-zinc-200"
                }`}
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="aspect-[2/3] w-full object-cover" />
                ) : (
                  <EmptyImage />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-brand">{item.title}</h2>
                    {isWinner && (
                      <span className="rounded-full bg-consensus px-2 py-1 text-xs font-bold text-brand-dark">
                        Winner
                      </span>
                    )}
                  </div>
                  {item.notes && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.notes}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
