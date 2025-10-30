"use client";

import { Suspense, useEffect, useState } from "react";
import NewPageClient from "./NewPageClient";

const LIST_TYPES = [
  { word: "watch", color: "text-rose-500" },
  { word: "book", color: "text-blue-500" },
  { word: "karaoke", color: "text-purple-500" },
  { word: "recipe", color: "text-emerald-500" },
  { word: "anything", color: "text-amber-500" },
];

export default function NewPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LIST_TYPES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const current = LIST_TYPES[currentIndex];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-brand-light p-8">
      <div className="mx-auto max-w-3xl">
        {/* Hero invitation */}
        <section className="mb-6 px-4 sm:px-0">
          <div className="flex flex-col space-y-2 text-left sm:text-center">
            <h1 className="text-3xl font-bold text-black sm:text-4xl">
              Build your{" "}
              <span className={`${current.color} transition-colors duration-500`}>
                {current.word}
              </span>
              list.
            </h1>
            <p className="text-lg font-normal text-zinc-700 sm:text-xl">If you're looking forward to it, so is someone else.</p>

          </div>
        </section>

        <div className="mt-2">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <NewPageClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}