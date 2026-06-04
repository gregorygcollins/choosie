"use client";

import { useState } from "react";
import UpsellModal from "./UpsellModal";

interface ChoosieModule {
  id: string;
  title: string;
  isPro: boolean;
}

const MODULES: ChoosieModule[] = [
  { id: "movies", title: "Movies", isPro: false },
  { id: "books", title: "Books", isPro: true },
  { id: "music", title: "Music", isPro: true },
  { id: "food", title: "Food", isPro: true },
  { id: "anything", title: "Anything", isPro: true },
];

interface ModuleSelectorProps {
  userIsPro: boolean;
  selectedModule: string;
  onSelectModule: (moduleId: string) => void;
}

function ModuleIcon({ module }: { module: string }) {
  if (module === "books") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 4.5h8a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3v-19Z" />
        <path d="M16 7.5h3a2 2 0 0 1 2 2v13h-5" />
        <path d="M8 8h6" />
        <path d="M8 12h6" />
      </svg>
    );
  }

  if (module === "music") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </svg>
    );
  }

  if (module === "food") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 3v8" />
        <path d="M4 3v8" />
        <path d="M10 3v8" />
        <path d="M4 11h6" />
        <path d="M7 11v10" />
        <path d="M17 3v18" />
        <path d="M17 3c2.2 1.5 3.3 3.6 3.3 6.1 0 2.1-.9 3.6-3.3 4" />
      </svg>
    );
  }

  if (module === "anything") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2.8 14.2 9 21 12l-6.8 3L12 21.2 9.8 15 3 12l6.8-3L12 2.8Z" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="m8 5 2 4" />
      <path d="m14 5 2 4" />
      <path d="M4 9h16" />
    </svg>
  );
}

function moduleAccent(module: string) {
  if (module === "books") return "text-blue-700 bg-blue-50 ring-blue-100";
  if (module === "music") return "text-violet-700 bg-violet-50 ring-violet-100";
  if (module === "food") return "text-emerald-700 bg-emerald-50 ring-emerald-100";
  if (module === "anything") return "text-rose-700 bg-rose-50 ring-rose-100";
  return "text-consensus-dark bg-consensus/20 ring-consensus/40";
}

export default function ModuleSelector({ userIsPro, selectedModule, onSelectModule }: ModuleSelectorProps) {
  const [upsellOpen, setUpsellOpen] = useState(false);
  // Bump this to force a fresh client remount after deploys (avoids stale cached bundles showing old option labels)
  const UI_LABEL_VERSION = "movies-tv-v3";

  const handleSelect = (moduleId: string) => {
    const selected = MODULES.find((m) => m.id === moduleId);
    
    if (selected && selected.isPro && !userIsPro) {
      setUpsellOpen(true);
    } else {
      onSelectModule(moduleId);
    }
  };

  return (
    <>
      <div className="mb-4" key={UI_LABEL_VERSION}>
        <div className="grid grid-cols-5 gap-2 rounded-2xl border border-brand/10 bg-white/85 p-2 shadow-soft backdrop-blur sm:gap-3 sm:p-3">
            {MODULES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                aria-pressed={selectedModule === option.id}
                className={[
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition sm:min-h-20 sm:gap-2 sm:px-3",
                  selectedModule === option.id
                    ? "border-consensus bg-consensus/15 text-brand shadow-sm"
                    : "border-transparent bg-white text-zinc-600 hover:border-brand/20 hover:bg-brand-light/40",
                ].join(" ")}
              >
                <span className={["inline-grid h-8 w-8 place-items-center rounded-full ring-1 sm:h-9 sm:w-9", moduleAccent(option.id)].join(" ")}>
                  <ModuleIcon module={option.id} />
                </span>
                <span className="block max-w-full truncate text-[10px] font-semibold leading-tight sm:text-sm">
                  {option.title}
                </span>
                {option.isPro && !userIsPro && <span className="sr-only">Pro</span>}
              </button>
            ))}
        </div>
      </div>

      <UpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </>
  );
}
