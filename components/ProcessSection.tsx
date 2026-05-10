"use client";

import Image from "next/image";

export default function ProcessSection() {
  return (
    <div className="my-8 w-full overflow-hidden px-1 sm:px-4">
      <Image
        src="/choosie-process.svg"
        alt="Choosie process: Curator, Editor, Programmer, Selector, Decider"
        width={600}
        height={100}
        priority={false}
        unoptimized
        className="mx-auto h-auto w-full max-w-6xl select-none"
      />
    </div>
  );
}
