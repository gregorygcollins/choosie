"use client";

import { Suspense, useEffect, useState } from "react";
import NewPageClient from "./NewPageClient";

const LIST_TYPES = [
  { word: "watch" },
  { word: "book" },
  { word: "music" },
  { word: "food" },
  { word: "anything" },
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
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        {/* Hero invitation */}
  <section className="mb-[0.225rem] px-4 sm:px-0 text-center">
          <h1 className="text-3xl font-bold text-brand sm:text-4xl">
            Build your{" "}
            <span className="relative inline-flex min-w-[9ch] justify-center align-baseline">
              <span
                className={`relative inline-block rounded-lg bg-consensus/10 px-2 text-brand-dark ring-1 ring-consensus/20 transition-all duration-700 ease-in-out ${
                  isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
              >
                {current.word}
                <span className="absolute inset-x-2 -bottom-1 h-1 rounded-full bg-consensus" aria-hidden="true" />
              </span>
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
          <div className="relative w-full max-w-[690px] overflow-visible">
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
                background: "transparent",
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
