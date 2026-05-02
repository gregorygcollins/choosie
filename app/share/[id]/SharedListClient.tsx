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
    <div className="flex h-full w-full items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
      +
    </div>
  );
}

export default function SharedListClient({ listId, token }: { listId: string; token: string }) {
  const [list, setList] = useState<SharedList | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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

  return (
    <main className="min-h-screen bg-brand-light p-6 sm:p-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-consensus-dark">Shared Choosie list</p>
            <h1 className="mt-2 text-3xl font-semibold text-brand sm:text-4xl">{list.title}</h1>
            <p className="mt-2 text-sm text-zinc-600">
              {list.items.length} {list.items.length === 1 ? "option" : "options"}
            </p>
          </div>
          <Link
            href="/new"
            className="inline-flex w-fit rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Create a list
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <div className="mb-4 flex justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="List view"
                aria-label="List view"
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
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md ${viewMode === "grid" ? "bg-zinc-200 shadow" : "hover:bg-zinc-100"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </button>
            </div>
          </div>

          {viewMode === "list" ? (
            <ul className="space-y-2">
              {list.items.map((item) => {
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <EmptyImage />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-brand">{item.title}</div>
                        {item.notes && <div className="truncate text-sm text-zinc-500">{item.notes}</div>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {list.items.map((item) => {
                return (
                  <article
                    key={item.id}
                    className="rounded-lg border border-zinc-200 p-3"
                  >
                    <div className="mb-2 h-14 w-14 overflow-hidden rounded-md">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <EmptyImage />
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="min-w-0 flex-1 line-clamp-2 text-sm font-medium text-brand">{item.title}</h2>
                    </div>
                    {item.notes && <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{item.notes}</p>}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
