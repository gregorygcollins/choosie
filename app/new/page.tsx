"use client";

import { Suspense, useEffect, useState } from "react";
import NewPageClient from "./NewPageClient";

const LIST_TYPES = [
  { word: "watch", color: "text-rose-500" },
  { word: "book", color: "text-blue-500" },
  { word: "music", color: "text-purple-500" },
  { word: "food", color: "text-emerald-500" },
  { word: "anything", color: "text-amber-500" },
];

// Calculate the maximum word length for consistent spacing
const maxWordLength = Math.max(...LIST_TYPES.map((t) => t.word.length));

export default function NewPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % LIST_TYPES.length);
        setIsTransitioning(false);
      }, 350); // Half of the transition duration for crossfade effect
    }, 2500);
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
              <span 
                className={`${current.color} transition-all duration-700 ease-in-out inline-block ${
                  isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                {current.word}
              </span>
              list.
            </h1>
            <p className="text-lg font-normal text-zinc-700 sm:text-xl">If you're into it, so is someone else.</p>
          </div>
        </section>

        {/* SVG connector placed between headline and form, width aligned to form container */}
        <div className="my-1 sm:my-2 flex justify-center">
          <img
            src="/choosie-process.svg"
            alt=""
            className="block h-auto w-full select-none"
            loading="lazy"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              if (!t.src.endsWith('/choosie-process.png')) {
                t.onerror = null; // prevent loops
                t.src = '/choosie-process.png';
              }
            }}
          />
        </div>

        <div className="mt-2">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <NewPageClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}