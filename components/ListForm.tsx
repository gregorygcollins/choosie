"use client";

import { useState, useEffect, useRef } from "react";

// simple unique id helper
function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// types
export type ChoosieItem = {
  id: string;
  title: string;
  notes?: string;
  image?: string;
};

export type ChoosieList = {
  id: string;
  title: string;
  items: ChoosieItem[];
  createdAt: string;
  // Module type for different list types (movies, books, recipes, etc.)
  moduleType?: string;
  // final outcome (optional)
  winnerId?: string;
  // Optional taste preferences (MVP for movies)
  preferences?: {
    mood?: "cozy" | "chill" | "hype" | "dark" | "feelgood";
    genres?: string[];
    era?: "classic" | "80s90s" | "2000s" | "2010s" | "2020s";
    minRating?: number;
  };
  // optional multi-narrower settings / progress
  narrowers?: number;
  // planner configuration and persisted plan
  narrowingPlan?: number[];
  narrowingTail?: number[]; // e.g., [5,3,1]
  minReductionFraction?: number; // e.g., 0.2
  // event metadata (optional)
  event?: {
    date?: string; // ISO date (YYYY-MM-DD or ISO string)
    location?: string;
    invitees?: string[]; // names or emails
    notes?: string;
    visibility?: "private" | "link"; // shareability
  };
  // progress: remaining item ids, which narrower index is next, and which round
  progress?: {
    remainingIds: string[];
    currentNarrower: number;
    round?: number;
    totalRounds?: number;
    history?: Array<{
      remainingIds: string[];
      currentNarrower: number;
      round: number;
    }>;
  };
};

// component
export default function ListForm({
  onSave,
  existingList,
}: {
  onSave: (list: ChoosieList) => void;
  existingList?: ChoosieList | null;
}) {
  const [title, setTitle] = useState(existingList?.title || "");
  const [items, setItems] = useState<ChoosieItem[]>(existingList?.items || []);
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  // movie autocomplete state
  const [sugs, setSugs] = useState<Array<{ id: string; title: string; year?: string; poster?: string; overview?: string }>>([]);
  const [sugsOpen, setSugsOpen] = useState(false);
  const [sugsLoading, setSugsLoading] = useState(false);
  const sugsRef = useRef<HTMLDivElement | null>(null);
  const VIEW_MODE_KEY = "choosie_view_mode_v1";
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    try {
      const raw = localStorage.getItem(VIEW_MODE_KEY);
      if (raw === "grid" || raw === "list") return raw;
    } catch (e) {
      // localStorage might be unavailable in some environments
    }
    return "list";
  });

  // persist view mode whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, viewMode);
    } catch (e) {
      // ignore
    }
  }, [viewMode]);

  // Fetch movie suggestions (debounced)
  useEffect(() => {
    if (!input || input.trim().length < 2) {
      setSugs([]);
      setSugsOpen(false);
      return;
    }
    let cancelled = false;
    setSugsLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/movies/search?query=${encodeURIComponent(input.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          const results = (data?.results || []).slice(0, 6);
          setSugs(results);
          setSugsOpen(true);
        })
        .catch(() => {
          if (!cancelled) setSugs([]);
        })
        .finally(() => {
          if (!cancelled) setSugsLoading(false);
        });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [input]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!sugsRef.current) return;
      if (!sugsRef.current.contains(e.target as Node)) {
        setSugsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Optional event metadata state
  const [eventDate, setEventDate] = useState<string>(existingList?.event?.date || "");
  const [eventLocation, setEventLocation] = useState<string>(existingList?.event?.location || "");
  const [eventInviteesInput, setEventInviteesInput] = useState<string>(existingList?.event?.invitees?.join(", ") || "");
  const [eventNotes, setEventNotes] = useState<string>(existingList?.event?.notes || "");
  const [eventVisibility, setEventVisibility] = useState<"private" | "link">(existingList?.event?.visibility || "private");

  

  // ...existing code...
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Update form when existingList is loaded
  useEffect(() => {
    if (existingList) {
      setTitle(existingList.title || "");
      setItems(existingList.items || []);
      setEventDate(existingList.event?.date || "");
      setEventLocation(existingList.event?.location || "");
      setEventInviteesInput(existingList.event?.invitees?.join(", ") || "");
      setEventNotes(existingList.event?.notes || "");
      setEventVisibility(existingList.event?.visibility || "private");
      // no-op: preferences removed
    }
  }, [existingList]);

  // ...existing code...

  function addItem() {
    if (!input.trim()) return;
    const title = input.trim();

    // Check for duplicates (case-insensitive)
    const duplicate = items.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }

    // Create item locally first
    const newId = id();
    const initialImage = imageUrl?.trim() || undefined;
    setItems((s) => [
      ...s,
      { id: newId, title, notes: note?.trim() || undefined, image: initialImage },
    ]);
  setInput("");
  setNote("");
  setImageUrl("");
  setSugsOpen(false);

    // Try to enrich with TMDB: poster and overview (use overview as notes if none provided)
    fetch(`/api/movies/search?query=${encodeURIComponent(title)}`)
      .then((r) => r.json())
      .then((data) => {
        const first = data?.results?.[0];
        const poster = first?.poster || null;
        const overview: string | undefined = first?.overview || undefined;
        setItems((prev) =>
          prev.map((it) =>
            it.id === newId
              ? {
                  ...it,
                  image: it.image || poster || undefined,
                  // If user didn't provide a note, use TMDB overview as a helpful summary
                  notes: (it.notes && it.notes.trim().length > 0) ? it.notes : (overview || undefined),
                }
              : it
          )
        );
      })
      .catch(() => {
        // silent fail; keep item as-is
      });
  }

  function removeItem(id: string) {
    setItems((s) => s.filter((it) => it.id !== id));
  }

  // drag and drop reorder helpers
  function reorder(from: number, to: number) {
    if (from === to) return;
    setItems((s) => {
      const copy = [...s];
      if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) return s;
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function onDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch {}
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    let from = dragIndex;
    if (from == null) {
      const txt = e.dataTransfer.getData("text/plain");
      const parsed = Number.parseInt(txt, 10);
      if (!Number.isNaN(parsed)) from = parsed;
    }
    if (from != null) reorder(from, index);
    setDragIndex(null);
  }

  function sendInvites() {
    // Require existing list id to generate a shareable link
    if (!existingList || !existingList.id) {
      alert("Save your watchlist first to get a shareable link.");
      return;
    }

    const raw = eventInviteesInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (raw.length === 0) {
      alert("Add at least one email in Invitees.");
      return;
    }
    // Basic email filter (very permissive)
    const emails = raw.filter((e) => /.+@.+\..+/.test(e));
    if (emails.length === 0) {
      alert("Please enter valid email addresses (comma-separated).");
      return;
    }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const link = `${origin}${basePath}/list/${existingList.id}`;
    const subject = `Join my watchlist: ${title.trim() || "Choosie"}`;
    const body = `Hey! I'd love your help narrowing this watchlist.\n\nOpen it here: ${link}\n\nWe’ll vote it down to one great pick together.\n\n—`;

    const mailto = `mailto:${encodeURIComponent(emails.join(","))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // Open mail client
    window.location.href = mailto;
  }

  function handleSave() {
    if (!title.trim()) {
      alert("Please add a list name");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one movie");
      return;
    }
    const invitees = eventInviteesInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const event: ChoosieList["event"] | undefined =
      eventDate || eventLocation || eventNotes || eventInviteesInput
        ? {
            date: eventDate || undefined,
            location: eventLocation?.trim() || undefined,
            invitees: invitees.length ? invitees : undefined,
            notes: eventNotes?.trim() || undefined,
            visibility: eventVisibility,
          }
        : undefined;

    const list: ChoosieList = {
      id: existingList?.id || id(),
      title: title.trim(),
      items,
      createdAt: existingList?.createdAt || new Date().toISOString(),
      event,
      // Preserve existing narrowing state if editing
      narrowers: existingList?.narrowers,
      narrowingPlan: existingList?.narrowingPlan,
      narrowingTail: existingList?.narrowingTail,
      minReductionFraction: existingList?.minReductionFraction,
      progress: existingList?.progress,
    };
    onSave(list);
  }

  return (
  <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 fade-in">
      {/* List name panel */}
      <div className="card panel-tier-2 p-4 hover:-translate-y-0.5 transition-transform duration-200">
        <label className="block text-sm font-medium text-neutral-700 mb-2">{existingList ? "Rename" : "Name your watchlist"}</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
          placeholder="Family vacation, Rainy weekend rewatchables, etc."
        />
      </div>

      {/* Add items panel */}
      <div className="card panel-tier-3 p-4 hover:-translate-y-0.5 transition-transform duration-200">
        <label className="block text-sm font-medium text-neutral-700 mb-2">Add movies</label>
        <div className="relative">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              className="flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
              placeholder="Movie title"
            />
            <button
              onClick={addItem}
              className="btn-amber px-5 py-2"
            >
              Add movie
            </button>
          </div>
          {/* suggestions dropdown */}
          <div ref={sugsRef} className="relative">
            {sugsOpen && (sugs.length > 0 || sugsLoading) && (
              <div className="absolute z-50 mt-2 w-full suggestion-menu max-h-64 overflow-auto fade-in">
                {sugsLoading && (
                  <div className="px-3 py-2 text-sm text-neutral-300">Searching…</div>
                )}
                {sugs.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      setInput(m.title);
                      // Prefill note with overview if not typed yet
                      setNote((prev) => (prev && prev.trim().length > 0 ? prev : (m.overview || "")));
                      setImageUrl(m.poster || "");
                      setSugsOpen(false);
                    }}
                    className="suggestion-item w-full flex items-center gap-3 text-left transition-colors"
                  >
                    {m.poster ? (
                      <img src={m.poster} alt="" className="w-10 h-14 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-14 rounded bg-[#373737] flex items-center justify-center text-neutral-200 text-xs">🎬</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#F8F5EE] truncate">{m.title}{m.year ? ` (${m.year})` : ""}</div>
                      {m.overview && <div className="text-xs text-neutral-300 truncate">{m.overview}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input-soft w-full mt-3 text-[0.95rem] placeholder-[#7A7A7A]"
          placeholder="Optional note"
        />
      </div>

      {/* Items list panel */}
      {items.length > 0 && (
        <div className="card panel-tier-1 p-4">
          <label className="block text-sm font-medium text-neutral-700 mb-3">Your movies</label>
          <ul className="space-y-3">
            {items.map((it, idx) => (
              <li
                key={it.id}
                className="flex items-center gap-4 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md"
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
              >
                <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center font-medium text-sm">{idx + 1}</div>
                {it.image ? (
                  <img src={it.image} alt={it.title} className="w-12 h-12 rounded-md object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-white/60 flex items-center justify-center text-gray-400">🎬</div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-neutral-800">{it.title}</div>
                  {it.notes && <div className="text-xs text-neutral-500">{it.notes}</div>}
                </div>
                <button
                  onClick={() => removeItem(it.id)}
                  className="inline-flex h-9 w-9 items-center justify-center text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 active:translate-y-px transition-colors"
                  title="Delete item"
                  aria-label="Delete item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-center">
        <button
          onClick={handleSave}
          className="btn-charcoal px-8 py-3 text-[1.05rem]"
        >
          {existingList ? "Update Watchlist" : "Create Watchlist"}
        </button>
      </div>
    </div>
  );
}