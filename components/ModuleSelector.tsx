"use client";

import { useState } from "react";
import UpsellModal from "./UpsellModal";

interface Module {
  id: string;
  title: string;
  icon: string;
  isPro: boolean;
}

const MODULES = [
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moduleId = e.target.value;
    const module = MODULES.find((m) => m.id === moduleId);
    
    if (module && module.isPro && !userIsPro) {
      setUpsellOpen(true);
      // Reset to movies
      e.target.value = "movies";
    } else {
      onSelectModule(moduleId);
    }
  };

  return (
    <>
  <div className="mb-6" key={UI_LABEL_VERSION}>
        <label htmlFor="module-select" className="mb-2 block text-sm font-medium text-zinc-700">
          What type of list?
        </label>
        <div className="relative">
          <select
            id="module-select"
            value={selectedModule}
            onChange={handleChange}
            className="peer w-full appearance-none rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-4 py-3 pr-12 text-base text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_1px_2px_rgba(0,0,0,.06)] transition focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand hover:border-zinc-300"
          >
            {MODULES.map((module) => (
              <option key={module.id} value={module.id}>
                {module.icon} {module.title}
                {module.isPro ? " (Pro)" : ""}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 peer-focus:text-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      <UpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </>
  );
}
