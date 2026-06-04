"use client";

import { Suspense, useEffect, useState } from "react";
import NewPageClient from "./NewPageClient";

const LIST_TYPES = [
  { word: "watch", color: "text-brand" },
  { word: "book", color: "text-blue-600" },
  { word: "music", color: "text-violet-600" },
  { word: "food", color: "text-consensus-dark" },
  { word: "anything", color: "text-rose-600" },
];

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
    <main className="min-h-screen px-4 pb-8 pt-5 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <section className="mb-4 text-left sm:mb-7 sm:text-center">
          <h1 className="text-3xl font-bold leading-tight text-brand sm:text-6xl">
            Build your{" "}
            <span
              className={`${current.color} inline-block transition-all duration-700 ease-in-out ${
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {current.word}
            </span>
            {" "}list.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-normal leading-6 text-zinc-600 sm:mx-auto sm:mt-4 sm:text-xl sm:leading-8">
            If you're into it, so is someone else.
          </p>
        </section>

        <div className="my-7 hidden justify-center sm:flex">
          <div className="relative w-full max-w-4xl overflow-visible rounded-lg border border-brand/10 bg-white px-6 py-7 shadow-soft">
            <img
              src="/choosie-process.svg?v=9"
              alt="Choosie process diagram"
              className="block opacity-80"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                background: "transparent",
              }}
            />
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <NewPageClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
