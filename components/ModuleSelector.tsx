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
  { id: "movies", title: "Movies", icon: "🎬", isPro: false },
  { id: "books", title: "Books", icon: "📚", isPro: true },
  { id: "food", title: "Food", icon: "🍳", isPro: true },
  { id: "music", title: "Music", icon: "�", isPro: true },
  { id: "anything", title: "Anything", icon: "✨", isPro: true },
];

interface ModuleSelectorProps {
  userIsPro: boolean;
  selectedModule: string;
  onSelectModule: (moduleId: string) => void;
}

export default function ModuleSelector({ userIsPro, selectedModule, onSelectModule }: ModuleSelectorProps) {
  const [upsellOpen, setUpsellOpen] = useState(false);

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
      <div className="mb-6">
        <label htmlFor="module-select" className="mb-2 block text-sm font-medium text-zinc-700">
          What type of list?
        </label>
        <select
          id="module-select"
          value={selectedModule}
          onChange={handleChange}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base font-medium text-zinc-900 shadow-sm transition-all hover:border-zinc-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {MODULES.map((module) => (
            <option key={module.id} value={module.id}>
              {module.icon} {module.title}
              {module.isPro ? " (Pro)" : ""}
            </option>
          ))}
        </select>
      </div>

      <UpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </>
  );
}
