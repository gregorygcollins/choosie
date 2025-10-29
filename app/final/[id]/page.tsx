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

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">List Not Found</h1>
        <p className="mb-6 text-zinc-600">We couldn't find the list you're looking for.</p>
        <Link
          href="/"
          className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors"
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
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="animate-bounce mb-8 text-4xl">
        🎉 🎊 🎈
      </div>
      
      <h1 className="text-3xl font-bold mb-2">{list.title}</h1>
      <p className="text-zinc-600 mb-8">And the winner is...</p>
      
      <div className="bg-white/80 rounded-2xl p-8 shadow-soft mb-12 transform hover:scale-105 transition-all duration-200">
        {winner.image ? (
          <img src={winner.image} alt={winner.title} className="w-full h-64 object-cover rounded-lg mb-4" />
        ) : null}
        <h2 className="text-4xl font-bold mb-3">{winner.title}</h2>
        {winner.notes && (
          <p className="text-zinc-600">{winner.notes}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/narrow/${list.id}`}
          className="inline-block rounded-full bg-white/70 px-6 py-3 text-zinc-700 hover:bg-white transition-colors"
        >
          ← Back
        </Link>
        <Link
          href="/new"
          className="inline-block rounded-full bg-brand px-8 py-4 font-semibold text-white hover:opacity-90 transition-colors"
        >
          Create another watchlist
        </Link>
      </div>
    </div>
  );
}