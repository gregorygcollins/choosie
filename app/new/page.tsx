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
    <main className="min-h-screen bg-gradient-to-b from-[#fafafa] to-[#f2f2f2] p-8">
      <div className="mx-auto max-w-3xl">
        {/* Hero invitation */}
  <section className="mb-[0.225rem] px-4 sm:px-0 text-center">
          <h1 className="text-3xl font-bold text-black sm:text-4xl">
            Build your{" "}
            <span
              className={`${current.color} transition-all duration-700 ease-in-out inline-block ${
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {current.word}
            </span>
            list.
          </h1>
          <p className="mt-2 text-lg font-normal text-zinc-700 sm:text-xl">
            If you're into it, so is someone else.
          </p>
        </section>

        {/* Choosie Process Diagram */}
        <div className="flex justify-center my-2">
          {/* Wrapper crops a few pixels and nudges content slightly right to give the first cloud more breathing room */}
          <div className="relative w-full max-w-[690px] overflow-hidden">
            <img
              src="/choosie-process.svg?v=9"
              alt="Choosie process diagram"
              className="block opacity-80"
              style={{
                width: "calc(100% + 16px)",
                transform: "translateX(2px)",
                marginTop: "0.25rem",
                marginBottom: "0.25rem",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* Form section */}
  <div className="mt-[0.075rem]">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <NewPageClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
