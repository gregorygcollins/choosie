"use client";

import { Suspense } from "react";
import NewPageClient from "./NewPageClient";

export default function NewPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-brand-light p-8">
      <div className="mx-auto max-w-3xl">
        {/* Hero invitation */}
        <section className="mb-6 px-4 sm:px-0">
          <div className="flex flex-col space-y-2 text-left sm:text-center">
            <h1 className="text-3xl font-bold text-black sm:text-4xl">Build your watchlist.</h1>
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