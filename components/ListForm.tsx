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
    <div className="w-full rounded-xl bg-white/80 p-6 shadow-soft transition-transform duration-200 ease-out transform motion-safe:translate-y-0">
  <label className="block mb-3 text-sm font-medium">Name your watchlist</label>
      <input
    value={title}
    onChange={(e) => setTitle(e.target.value)}
  className="w-full rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 pr-10 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
  placeholder="Family vacation, Rainy weekend rewatchables, Oscar contenders…"
    />
      <p className="text-sm text-zinc-500 mt-1">
        Add the movies you want to watch — Choosie will find what hits for everyone else.
      </p>

        <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Start building</label>
          <div className="flex items-center gap-2">
            {/* list view button */}
            <button
              type="button"
              title="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-md ${viewMode === "list" ? "bg-white/90 shadow" : "hover:bg-white/40"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="3" y="5" width="18" height="2" rx="1" fill="currentColor" />
                <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
                <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
            {/* grid view button */}
            <button
              type="button"
              title="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md ${viewMode === "grid" ? "bg-white/90 shadow" : "hover:bg-white/40"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="13" y="3" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="3" y="13" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="13" y="13" width="8" height="8" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 relative">
          <div className="col-span-2 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              className="w-full rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
              placeholder="Movie title"
            />
            {/* suggestions dropdown */}
            <div ref={sugsRef} className="relative">
              {sugsOpen && (sugs.length > 0 || sugsLoading) && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white/95 backdrop-blur shadow-soft max-h-64 overflow-auto">
                  {sugsLoading && (
                    <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
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
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50"
                    >
                      {m.poster ? (
                        <img src={m.poster} alt="" className="w-8 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-12 rounded bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs">🎬</div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{m.title}{m.year ? ` (${m.year})` : ""}</div>
                        {m.overview && <div className="text-xs text-zinc-500 line-clamp-2">{m.overview}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">Type to search and pick a result, or press Enter to add.</p>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
            placeholder="Optional note"
          />
          <div className="sm:col-span-3 flex justify-end">
            <button
              onClick={addItem}
              className="rounded-full bg-brand px-4 py-2 text-white hover:opacity-90 transition-colors"
            >
              Add movie
            </button>
          </div>
        </div>

        {/* Virtual session options moved to saved list page */}

        {viewMode === "list" ? (
          <ul className="mt-3 space-y-2">
            {items.map((it, idx) => (
              <li
                key={it.id}
                className="flex items-start justify-between gap-4 rounded-md bg-white/60 px-3 py-2"
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
              >
                <div className="flex items-center gap-3">
                  {/* numeric badge */}
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-medium text-sm">
                      {idx + 1}
                    </div>
                  </div>
                  {/* drag handle */}
                  <div className="cursor-grab text-zinc-400" title="Drag to reorder" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                      <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                    </svg>
                  </div>

                  {it.image ? (
                    <img src={it.image} alt={it.title} className="w-14 h-14 rounded-md object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">📷</div>
                  )}

                  <div>
                    <div className="font-medium">{it.title}</div>
                    {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(it.id)}
                  className="text-sm text-rose-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="rounded-md bg-white/60 p-3 flex flex-col gap-2"
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-medium text-sm">
                    {idx + 1}
                  </div>
                  <div className="cursor-grab text-zinc-400 mt-1" title="Drag to reorder" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                      <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                    </svg>
                  </div>
                  {it.image ? (
                    <img src={it.image} alt={it.title} className="w-16 h-16 rounded-md object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">📷</div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{it.title}</div>
                    {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => removeItem(it.id)} className="text-sm text-rose-500">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors active:translate-y-px"
          >
            {existingList ? "Update Watchlist" : "Create Watchlist"}
          </button>
        </div>
      </div>
    </div>
  );
}