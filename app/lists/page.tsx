"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadLists } from "@/lib/storage";
import type { ChoosieList } from "@/components/ListForm";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ListsPage() {
  const [lists, setLists] = useState<ChoosieList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Try server-backed lists first (requires sign-in)
        const res = await fetch("/api/choosie/getMyLists", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.ok && Array.isArray(data.lists)) {
            setLists(data.lists);
            setLoading(false);
            return;
          }
        }
      } catch {}
      // Fallback: local lists
      if (!cancelled) {
        setLists(loadLists());
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (lists.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8 dark:bg-black">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-black dark:text-white">
            No lists yet
          </h1>
          <p className="mb-8 text-zinc-600 dark:text-zinc-400">
            You haven't created any lists yet — start one!
          </p>
          <Link
            href="/new"
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-white transition-all hover:opacity-90 active:translate-y-px"
          >
            Create your first list
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen px-8 py-12 sm:px-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            My Lists
          </h1>
          <Link
            href="/new"
            className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm text-white transition-all hover:opacity-90 active:translate-y-px"
          >
            Create new list
          </Link>
        </div>

        <div className="grid gap-4">
          {lists.map((list) => {
            const listTypeName = list.moduleType === "books" ? "booklist" :
                                 list.moduleType === "food" ? "food list" :
                                 list.moduleType === "music" ? "music list" :
                                 list.moduleType === "anything" ? "list" : "watchlist";
            
            return (
            <div
              key={list.id}
              className="card flex flex-col gap-4 rounded-2xl p-6 transition-transform hover:translate-y-[-2px] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-medium text-black dark:text-white">
                  {list.title}
                </h2>
                <div className="mt-1 flex gap-4 text-sm text-zinc-500">
                  <span>{list.items.length} items</span>
                  <span>Created {formatDate(list.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/list/${list.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-brand px-4 text-sm text-white transition-all hover:opacity-90 active:translate-y-px"
                >
                  View {listTypeName}
                </Link>
                {list.narrowers && (
                  <Link
                    href={`/narrow/${list.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 px-4 text-sm transition-all hover:bg-black/[.03] active:translate-y-px dark:border-white/20 dark:hover:bg-white/[.06]"
                  >
                    Continue narrowing
                  </Link>
                )}
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}