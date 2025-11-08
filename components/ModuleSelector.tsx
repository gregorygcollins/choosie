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
        <label htmlFor="module-select" className="mb-2 block text-sm font-medium text-gray-600">
          What type of list?
        </label>
        <div className="relative bg-white/50 backdrop-blur-md rounded-2xl p-4 shadow-lg shadow-black/5 hover:-translate-y-0.5 transition-transform duration-200">
          <select
            id="module-select"
            value={selectedModule}
            onChange={handleChange}
            className="peer w-full appearance-none bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-base text-white shadow-xl transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 hover:border-gray-600"
          >
            {MODULES.map((module) => (
              <option key={module.id} value={module.id}>
                {module.icon} {module.title}
                {module.isPro ? " (Pro)" : ""}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <span className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-amber-400">
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
