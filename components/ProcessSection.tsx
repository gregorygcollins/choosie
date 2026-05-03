"use client";

import Image from "next/image";

export default function ProcessSection() {
  return (
    <div className="my-10 w-full flex justify-center">
      <Image
        src="/choosie-process.svg"
        alt="Choosie process: Curator, Editor, Programmer, Selector, Decider"
        width={1152}
        height={768}
        priority={false}
        unoptimized
        className="h-auto w-full max-w-[34rem] select-none"
      />
    </div>
  );
}
