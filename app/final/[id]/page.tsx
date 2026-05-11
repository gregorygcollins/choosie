"use client";

import { useEffect, useState } from "react";
import { getList } from "@/lib/storage";
import { ChoosieList } from "@/components/ListForm";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function FinalPage() {
  const params = useParams();
  const [list, setList] = useState<ChoosieList | undefined>();

  useEffect(() => {
    const listData = getList(params.id as string);
    if (listData) {
      setList(listData);
    }
  }, [params.id]);

  // Helper to get list type name
  const getListTypeName = () => {
    if (!list) return "list";
    if (list.moduleType === "books") return "booklist";
    if (list.moduleType === "food") return "food list";
    if (list.moduleType === "music") return "musiclist";
    if (list.moduleType === "anything") return "list";
    return "watchlist"; // default for movies
  };

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">List Not Found</h1>
        <p className="mb-6 text-zinc-600">We couldn't find the list you're looking for.</p>
        <Link
          href="/"
          className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  // determine winner priority: winnerId (explicit) -> progress.remainingIds (len 1) -> first item fallback
  let winner = list.items[0];
  if (list.winnerId) {
    const found = list.items.find((i) => i.id === list.winnerId);
    if (found) winner = found;
  } else if (list.progress?.remainingIds && list.progress.remainingIds.length === 1) {
    const winId = list.progress.remainingIds[0];
    const found = list.items.find((i) => i.id === winId);
    if (found) winner = found;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand">
        TIME TO CHOOSIE
      </p>
      <h1 className="mt-4 text-3xl font-bold text-brand sm:text-5xl">{list.title}</h1>
      <p className="mt-3 text-lg font-semibold text-zinc-700">And the winner is...</p>

      <div className="mx-auto mt-8 mb-12 max-w-xl rounded-lg border border-zinc-200 bg-white px-5 py-8 shadow-soft sm:px-8">
        {winner.image ? (
          <div className="mx-auto mb-6 aspect-[2/3] w-60 max-w-[76vw] overflow-hidden rounded-lg bg-zinc-950 shadow-2xl ring-4 ring-consensus/50 sm:w-72">
            <img src={winner.image} alt={winner.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="mx-auto mb-6 grid aspect-[2/3] w-60 max-w-[76vw] place-items-center rounded-lg bg-brand-light text-6xl text-brand shadow-xl sm:w-72">
            🎉
          </div>
        )}
        <h2 className="text-4xl font-bold text-brand sm:text-5xl">{winner.title}</h2>
        {winner.notes && (
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-zinc-600">{winner.notes}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/narrow/${list.id}`}
          className="inline-block rounded-full bg-brand px-6 py-3 text-white hover:bg-brand-dark transition-colors"
        >
          ← Back
        </Link>
        <Link
          href="/new"
          className="inline-block rounded-full bg-brand px-8 py-4 font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          Create another {getListTypeName()}
        </Link>
      </div>
    </div>
  );
}
