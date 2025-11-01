"use client";

import Image from "next/image";

export default function ProcessSection() {
  return (
    <section className="mx-auto my-12 w-full max-w-4xl rounded-2xl bg-zinc-50 px-6 py-10 sm:px-10 sm:py-14">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
          From many possibilities to one joyful decision.
        </h2>
        <div className="mt-6 flex justify-center">
          {/* Important: image must be provided exactly as-is at public/choosie-process.png */}
          {/* Using next/image with fixed intrinsic sizing but no transforms to keep it pixel-faithful */}
          <Image
            src="/choosie-process.png"
            alt="Choosie process: Programmer, Curator, Selector, Decider"
            width={1152}
            height={768}
            priority={false}
            unoptimized
            className="h-auto w-full max-w-3xl select-none"
          />
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Choosie guides groups from exploration to clarity through these four phases.
        </p>
      </div>
    </section>
  );
}
