"use client";

import { useState } from "react";
import UpsellModal from "./UpsellModal";

interface ChoosieModule {
  id: string;
  title: string;
  icon: string;
  isPro: boolean;
}

const MODULES: ChoosieModule[] = [
  { id: "movies", title: "Movies & TV", icon: "🎬", isPro: false },
  { id: "books", title: "Books", icon: "📚", isPro: true },
  { id: "food", title: "Food", icon: "🍳", isPro: true },
  { id: "music", title: "Music", icon: "🎵", isPro: true },
  { id: "anything", title: "Anything", icon: "✨", isPro: true },
];

interface ModuleSelectorProps {
  userIsPro: boolean;
  selectedModule: string;
  onSelectModule: (moduleId: string) => void;
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
      <div className="mb-6" key={UI_LABEL_VERSION}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <label className="block text-sm font-semibold text-brand">
          What type of list?
          </label>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Pick a format
          </span>
        </div>
        <div className="grid gap-3 rounded-lg border border-brand/10 bg-white p-3 shadow-soft sm:grid-cols-5">
            {MODULES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                aria-pressed={selectedModule === option.id}
                className={[
                  "flex min-h-24 flex-col items-start justify-between rounded-lg border p-3 text-left transition",
                  selectedModule === option.id
                    ? "border-consensus bg-consensus/15 text-brand shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-brand/25 hover:bg-brand-light/50",
                ].join(" ")}
              >
                <span className="text-2xl" aria-hidden="true">{option.icon}</span>
                <span>
                  <span className="block text-sm font-semibold leading-tight">{option.title}</span>
                  {option.isPro && (
                    <span className="mt-1 inline-flex rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
                      Pro
                    </span>
                  )}
                </span>
              </button>
            ))}
        </div>
      </div>

      <UpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </>
  );
}
