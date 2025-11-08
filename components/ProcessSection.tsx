"use client";

import Image from "next/image";

export default function ProcessSection() {
  return (
    <section className="mx-auto my-12 w-full max-w-4xl rounded-2xl bg-zinc-50 px-6 py-10 sm:px-10 sm:py-14">
      <div className="text-center">
        <div className="flex justify-center">
          {/* Narrowing process graphic showing workflow */}
          <Image
            src="/choosie-process.svg"
            alt="Choosie process: Programmer, Curator, Selector, Decider"
            width={1152}
            height={768}
            priority={false}
            unoptimized
            className="h-auto w-full max-w-[34rem] select-none"
          />
        </div>
      </div>
    </section>
  );
}
