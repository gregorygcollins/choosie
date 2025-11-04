"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ListForm from "../../components/ListForm";
import BookForm from "../../components/BookForm";
import { upsertList, getList } from "../../lib/storage";
import type { ChoosieList, ChoosieItem } from "../../components/ListForm";
import type { BookSearchResult } from "../../lib/googleBooks";
import type { SpotifyTrack } from "../../lib/spotify";
import ModuleSelector from "../../components/ModuleSelector";

// simple unique id helper
function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export default function NewPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const [existingList, setExistingList] = useState<ChoosieList | null>(null);
  const [me, setMe] = useState<{ id?: string; isPro?: boolean } | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("movies");
  
  // Book list state
  const [bookTitle, setBookTitle] = useState("");
  const [bookItems, setBookItems] = useState<ChoosieItem[]>([]);
  const [bookNote, setBookNote] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Music list state
  const [musicTitle, setMusicTitle] = useState("");
  const [musicItems, setMusicItems] = useState<ChoosieItem[]>([]);
  const [musicNote, setMusicNote] = useState("");
  const [musicAlbumArt, setMusicAlbumArt] = useState<string | undefined>(undefined);
  const [musicViewMode, setMusicViewMode] = useState<"list" | "grid">("list");
  const [musicDragIndex, setMusicDragIndex] = useState<number | null>(null);

  // Food list state
  const [foodTitle, setFoodTitle] = useState("");
  const [foodItems, setFoodItems] = useState<ChoosieItem[]>([]);
  const [foodNote, setFoodNote] = useState("");
  const [foodViewMode, setFoodViewMode] = useState<"list" | "grid">("list");
  const [foodDragIndex, setFoodDragIndex] = useState<number | null>(null);

  // Anything list state (no API search, manual entry only)
  const [anythingTitle, setAnythingTitle] = useState("");
  const [anythingItems, setAnythingItems] = useState<ChoosieItem[]>([]);
  const [anythingInput, setAnythingInput] = useState("");
  const [anythingNote, setAnythingNote] = useState("");
  const [anythingViewMode, setAnythingViewMode] = useState<"list" | "grid">("list");
  const [anythingDragIndex, setAnythingDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editId) {
      const list = getList(editId);
      if (list) {
        setExistingList(list);
        if (list.moduleType === "books") {
          setSelectedModule("books");
          setBookTitle(list.title);
          setBookItems(list.items);
        } else if (list.moduleType === "music") {
          setSelectedModule("music");
          setMusicTitle(list.title);
          setMusicItems(list.items);
        } else if (list.moduleType === "food") {
          setSelectedModule("food");
          setFoodTitle(list.title);
          setFoodItems(list.items);
        } else if (list.moduleType === "anything") {
          setSelectedModule("anything");
          setAnythingTitle(list.title);
          setAnythingItems(list.items);
        }
      }
    }
  }, [editId]);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (!cancelled) setMe(data?.user || null);
      } catch {
        if (!cancelled) setMe(null);
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  // Removed all suggestion/autocomplete effects for books, music, and food

  function handleSave(list: any) {
    const listWithModule = {
      ...list,
      moduleType: selectedModule,
    };
    upsertList(listWithModule);
    // If signed in, also persist to server so it appears across devices
    if (me && (me as any).id) {
      const payload = {
        title: listWithModule.title,
        moduleType: selectedModule,
        items: (listWithModule.items || []).map((it: any) => ({
          title: it.title,
          notes: it.notes,
          image: it.image,
        })),
      };
      fetch(`/api/choosie/createList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("createList failed");
          const data = await res.json();
          if (data?.ok && data?.url) {
            router.push(data.url);
            return;
          }
          router.push(`/list/${list.id}`);
        })
        .catch(() => {
          // fall back to local view on failure
          router.push(`/list/${list.id}`);
        });
    } else {
      router.push(`/list/${list.id}`);
    }
  }

  function handleSelectModule(moduleId: string) {
    setSelectedModule(moduleId);
    // Reset book state
    setBookTitle("");
    setBookItems([]);
    setBookNote("");
    // Reset music state
    setMusicTitle("");
    setMusicItems([]);
    setMusicNote("");
    setMusicAlbumArt(undefined);
    // Reset food state
    setFoodTitle("");
    setFoodItems([]);
    setFoodNote("");
    // Reset anything state
    setAnythingTitle("");
    setAnythingItems([]);
    setAnythingInput("");
    setAnythingNote("");
  }

  function selectBookSuggestion(book: BookSearchResult) {
  // Removed: suggestion/autocomplete logic
  }

  function selectSpotifyTrack(track: SpotifyTrack) {
  // Removed: suggestion/autocomplete logic
  }

  function addBookItem() {
    // Manual add only
    const title = bookTitle.trim();
    if (!title) return;
    const duplicate = bookItems.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }
    setBookItems((s) => [
      ...s,
      { 
        id: id(), 
        title, 
        notes: bookNote?.trim() || undefined
      },
    ]);
    setBookTitle("");
    setBookNote("");
  }

  function removeBookItem(itemId: string) {
    setBookItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  // Drag and drop for books
  function reorderBooks(from: number, to: number) {
    if (from === to) return;
    setBookItems((s) => {
      const copy = [...s];
      if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) return s;
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function onBookDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch {}
  }

  function onBookDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onBookDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    let from = dragIndex;
    if (from == null) {
      const txt = e.dataTransfer.getData("text/plain");
      const parsed = Number.parseInt(txt, 10);
      if (!Number.isNaN(parsed)) from = parsed;
    }
    if (from != null) reorderBooks(from, index);
    setDragIndex(null);
  }

  function handleSaveBookList() {
    if (!bookTitle.trim()) {
      alert("Please add a list name");
      return;
    }
    if (bookItems.length === 0) {
      alert("Please add at least one book");
      return;
    }

    const list: ChoosieList = {
      id: existingList?.id || `book-${Date.now()}`,
      title: bookTitle,
      moduleType: "books",
      items: bookItems,
      createdAt: existingList?.createdAt || new Date().toISOString(),
    };

    upsertList(list);
    if (me?.id) {
      const payload = {
        title: list.title,
        moduleType: "books",
        items: list.items.map((it) => ({ title: it.title, notes: it.notes, image: it.image })),
      };
      fetch(`/api/choosie/createList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("createList failed");
          const data = await res.json();
          if (data?.ok && data?.url) return router.push(data.url);
          return router.push(`/list/${list.id}`);
        })
        .catch(() => router.push(`/list/${list.id}`));
    } else {
      router.push(`/list/${list.id}`);
    }
  }

  // ========== KARAOKE MODULE FUNCTIONS ==========
  function addMusicItem() {
    // Manual add only
    const title = musicTitle.trim();
    if (!title) return;
    const duplicate = musicItems.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }
    setMusicItems((s) => [
      ...s,
      { 
        id: id(), 
        title, 
        notes: musicNote?.trim() || undefined,
        image: musicAlbumArt
      },
    ]);
    setMusicTitle("");
    setMusicNote("");
    setMusicAlbumArt(undefined);
  }

  function removeMusicItem(itemId: string) {
    setMusicItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  function reorderMusic(from: number, to: number) {
    if (from === to) return;
    setMusicItems((s) => {
      const copy = [...s];
      if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) return s;
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function onMusicDragStart(e: React.DragEvent, index: number) {
    setMusicDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch {}
  }

  function onMusicDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onMusicDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    let from = musicDragIndex;
    if (from == null) {
      const txt = e.dataTransfer.getData("text/plain");
      const parsed = Number.parseInt(txt, 10);
      if (!Number.isNaN(parsed)) from = parsed;
    }
    if (from != null) reorderMusic(from, index);
    setMusicDragIndex(null);
  }

  function handleSaveMusicList() {
    if (!musicTitle.trim()) {
      alert("Please add a list name");
      return;
    }
    if (musicItems.length === 0) {
      alert("Please add at least one song");
      return;
    }

    const list: ChoosieList = {
      id: existingList?.id || `music-${Date.now()}`,
      title: musicTitle,
      moduleType: "music",
      items: musicItems,
      createdAt: existingList?.createdAt || new Date().toISOString(),
    };

    upsertList(list);
    if (me?.id) {
      const payload = {
        title: list.title,
        moduleType: "music",
        items: list.items.map((it) => ({ title: it.title, notes: it.notes, image: it.image })),
      };
      fetch(`/api/choosie/createList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("createList failed");
          const data = await res.json();
          if (data?.ok && data?.url) return router.push(data.url);
          return router.push(`/list/${list.id}`);
        })
        .catch(() => router.push(`/list/${list.id}`));
    } else {
      router.push(`/list/${list.id}`);
    }
  }

  // ========== FOOD MODULE FUNCTIONS ==========
  function addFoodItem() {
    // Manual add only
    const title = foodTitle.trim();
    if (!title) return;
    const duplicate = foodItems.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }
    const newId = id();
    setFoodItems((s) => [
      ...s,
      { 
        id: newId, 
        title, 
        notes: foodNote?.trim() || undefined
      },
    ]);
    setFoodTitle("");
    setFoodNote("");
    // Fetch a representative meal image (not recipe-specific) from Wikimedia Commons
    fetch(`/api/food/image?q=${encodeURIComponent(title)}`)
      .then((res) => res.json())
      .then((data) => {
        const img: string | undefined = data?.image || undefined;
        if (img) {
          setFoodItems((prev) => prev.map((it) => (it.id === newId ? { ...it, image: img } : it)));
        }
      })
      .catch(() => {});
  }

  function removeFoodItem(itemId: string) {
    setFoodItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  function reorderFood(from: number, to: number) {
    if (from === to) return;
    setFoodItems((s) => {
      const copy = [...s];
      if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) return s;
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function onFoodDragStart(e: React.DragEvent, index: number) {
    setFoodDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch {}
  }

  function onFoodDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onFoodDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    let from = foodDragIndex;
    if (from == null) {
      const txt = e.dataTransfer.getData("text/plain");
      const parsed = Number.parseInt(txt, 10);
      if (!Number.isNaN(parsed)) from = parsed;
    }
    if (from != null) reorderFood(from, index);
    setFoodDragIndex(null);
  }

  function handleSaveFoodList() {
    if (!foodTitle.trim()) {
      alert("Please add a list name");
      return;
    }
    if (foodItems.length === 0) {
      alert("Please add at least one dish");
      return;
    }

    const list: ChoosieList = {
      id: existingList?.id || `food-${Date.now()}`,
      title: foodTitle,
      moduleType: "food",
      items: foodItems,
      createdAt: existingList?.createdAt || new Date().toISOString(),
    };

    upsertList(list);
    if (me?.id) {
      const payload = {
        title: list.title,
        moduleType: "food",
        items: list.items.map((it) => ({ title: it.title, notes: it.notes })),
      };
      fetch(`/api/choosie/createList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("createList failed");
          const data = await res.json();
          if (data?.ok && data?.url) return router.push(data.url);
          return router.push(`/list/${list.id}`);
        })
        .catch(() => router.push(`/list/${list.id}`));
    } else {
      router.push(`/list/${list.id}`);
    }
  }

  // ========== ANYTHING MODULE FUNCTIONS ==========
  function addAnythingItem() {
    if (!anythingInput.trim()) return;
    
    const title = anythingInput.trim();
    const duplicate = anythingItems.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );
    
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }
    
    setAnythingItems((s) => [
      ...s,
      { 
        id: id(), 
        title, 
        notes: anythingNote?.trim() || undefined
      },
    ]);
    setAnythingInput("");
    setAnythingNote("");
  }

  function removeAnythingItem(itemId: string) {
    setAnythingItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  function reorderAnything(from: number, to: number) {
    if (from === to) return;
    setAnythingItems((s) => {
      const copy = [...s];
      if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) return s;
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function onAnythingDragStart(e: React.DragEvent, index: number) {
    setAnythingDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch {}
  }

  function onAnythingDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onAnythingDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    let from = anythingDragIndex;
    if (from == null) {
      const txt = e.dataTransfer.getData("text/plain");
      const parsed = Number.parseInt(txt, 10);
      if (!Number.isNaN(parsed)) from = parsed;
    }
    if (from != null) reorderAnything(from, index);
    setAnythingDragIndex(null);
  }

  function handleSaveAnythingList() {
    if (!anythingTitle.trim()) {
      alert("Please add a list name");
      return;
    }
    if (anythingItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    const list: ChoosieList = {
      id: existingList?.id || `anything-${Date.now()}`,
      title: anythingTitle,
      moduleType: "anything",
      items: anythingItems,
      createdAt: existingList?.createdAt || new Date().toISOString(),
    };

    upsertList(list);
    router.push(`/list/${list.id}`);
  }

  return (
    <>
      <ModuleSelector 
        userIsPro={me?.isPro || false} 
        selectedModule={selectedModule}
        onSelectModule={handleSelectModule}
      />

      {selectedModule === "books" ? (
        <div className="w-full rounded-xl bg-white/80 p-6 shadow-soft transition-transform duration-200 ease-out transform motion-safe:translate-y-0">
          <label className="block mb-3 text-sm font-medium">Name your booklist</label>
          <input
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 shadow-inner"
            placeholder="Book club, Reading group, etc."
          />
          <p className="text-sm text-zinc-500 mt-1">
            Add the books you want to read — Choosie will find what hits for everyone.
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
                <div className="flex items-center gap-3">
                <input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBookItem();
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
                  placeholder="Book title"
                />
                {/* Removed: book suggestion thumbnail */}
                </div>
                {/* Book suggestions dropdown */}
                {/* Removed: book suggestions dropdown and loading indicator */}
              </div>
              <input
                value={bookNote}
                onChange={(e) => setBookNote(e.target.value)}
                className="rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
                placeholder="Optional note"
              />
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={addBookItem}
                  className="rounded-full bg-brand px-4 py-2 text-white hover:opacity-90 transition-colors"
                >
                  Add book
                </button>
              </div>
            </div>

            {viewMode === "list" ? (
              <ul className="mt-3 space-y-2">
                {bookItems.map((it, idx) => (
                  <li
                    key={it.id}
                    className="flex items-start justify-between gap-4 rounded-md bg-white/60 px-3 py-2"
                    draggable
                    onDragStart={(e) => onBookDragStart(e, idx)}
                    onDragOver={onBookDragOver}
                    onDrop={(e) => onBookDrop(e, idx)}
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
                        <div className="w-14 h-14 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">📚</div>
                      )}

                      <div>
                        <div className="font-medium">{it.title}</div>
                        {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeBookItem(it.id)}
                      className="text-sm text-rose-500"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bookItems.map((it, idx) => (
                  <div
                    key={it.id}
                    className="rounded-md bg-white/60 p-3 flex flex-col gap-2"
                    draggable
                    onDragStart={(e) => onBookDragStart(e, idx)}
                    onDragOver={onBookDragOver}
                    onDrop={(e) => onBookDrop(e, idx)}
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
                        <div className="w-16 h-16 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">📚</div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{it.title}</div>
                        {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => removeBookItem(it.id)} className="text-sm text-rose-500">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveBookList}
                className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors active:translate-y-px"
              >
                {existingList ? "Update Booklist" : "Create Booklist"}
              </button>
            </div>
          </div>
        </div>
      ) : selectedModule === "music" ? (
          musicModuleJSX()
      ) : selectedModule === "food" ? (
          foodModuleJSX()
      ) : selectedModule === "anything" ? (
          anythingModuleJSX()
      ) : (
        <ListForm onSave={handleSave} existingList={existingList} />
      )}
    </>
  );

  // ========== KARAOKE MODULE COMPONENT ==========
    function musicModuleJSX() {
    return (
      <div className="w-full rounded-xl bg-white/80 p-6 shadow-soft transition-transform duration-200 ease-out transform motion-safe:translate-y-0">
        <label className="block mb-3 text-sm font-medium">Name your music list</label>
        <input
          value={musicTitle}
          onChange={(e) => setMusicTitle(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 shadow-inner"
          placeholder="Karaoke night, Roadtrip, etc."
        />
        <p className="text-sm text-zinc-500 mt-1">
          Add the songs you want — Choosie will find what hits for everyone.
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Start building</label>
            <div className="flex items-center gap-2">
              {/* list view button */}
              <button
                type="button"
                title="List view"
                aria-pressed={musicViewMode === "list"}
                onClick={() => setMusicViewMode("list")}
                className={`p-1 rounded-md ${musicViewMode === "list" ? "bg-white/90 shadow" : "hover:bg-white/40"}`}
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
                aria-pressed={musicViewMode === "grid"}
                onClick={() => setMusicViewMode("grid")}
                className={`p-1 rounded-md ${musicViewMode === "grid" ? "bg-white/90 shadow" : "hover:bg-white/40"}`}
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
                value={musicTitle}
                onChange={(e) => setMusicTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMusicItem();
                  }
                }}
                className="w-full rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
                placeholder="Song title"
              />
              {/* Spotify search dropdown */}
              {/* Removed: music suggestions dropdown and loading indicator */}
            </div>
            <input
              value={musicNote}
              onChange={(e) => setMusicNote(e.target.value)}
              className="rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
              placeholder="Optional note"
            />
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={addMusicItem}
                className="rounded-full bg-brand px-4 py-2 text-white hover:opacity-90 transition-colors"
              >
                Add song
              </button>
            </div>
          </div>

          {musicViewMode === "list" ? (
            <ul className="mt-3 space-y-2">
              {musicItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-start justify-between gap-4 rounded-md bg-white/60 px-3 py-2"
                  draggable
                  onDragStart={(e) => onMusicDragStart(e, idx)}
                  onDragOver={onMusicDragOver}
                  onDrop={(e) => onMusicDrop(e, idx)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-medium text-sm">
                        {idx + 1}
                      </div>
                    </div>
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
                      <div className="w-14 h-14 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">�</div>
                    )}
                    <div>
                      <div className="font-medium">{it.title}</div>
                      {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMusicItem(it.id)}
                    className="text-sm text-rose-500"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {musicItems.map((it, idx) => (
                <div
                  key={it.id}
                  className="rounded-md bg-white/60 p-3 flex flex-col gap-2"
                  draggable
                  onDragStart={(e) => onMusicDragStart(e, idx)}
                  onDragOver={onMusicDragOver}
                  onDrop={(e) => onMusicDrop(e, idx)}
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
                      <div className="w-16 h-16 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">�</div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{it.title}</div>
                      {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => removeMusicItem(it.id)} className="text-sm text-rose-500">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveMusicList}
              className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors active:translate-y-px"
            >
              {existingList ? "Update Music List" : "Create Music List"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== FOOD MODULE COMPONENT ==========
    function foodModuleJSX() {
    return (
      <div className="w-full rounded-xl bg-white/80 p-6 shadow-soft transition-transform duration-200 ease-out transform motion-safe:translate-y-0">
        <label className="block mb-3 text-sm font-medium">Name your food list</label>
        <input
          value={foodTitle}
          onChange={(e) => setFoodTitle(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 shadow-inner"
          placeholder="Weekday dinners, Holiday feasts, Side dishes, etc."
        />
        <p className="text-sm text-zinc-500 mt-1">
          Add the dishes you want to try — Choosie will find what hits for everyone.
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Start building</label>
            <div className="flex items-center gap-2">
              {/* list view button */}
              <button
                type="button"
                title="List view"
                aria-pressed={foodViewMode === "list"}
                onClick={() => setFoodViewMode("list")}
                className={`p-1 rounded-md ${foodViewMode === "list" ? "bg-white/90 shadow" : "hover:bg-white/40"}`}
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
                aria-pressed={foodViewMode === "grid"}
                onClick={() => setFoodViewMode("grid")}
                className={`p-1 rounded-md ${foodViewMode === "grid" ? "bg-white/90 shadow" : "hover:bg-white/40"}`}
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
                value={foodTitle}
                onChange={(e) => setFoodTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFoodItem();
                  }
                }}
                className="w-full rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
                placeholder="Dish name"
              />
              {/* Food search dropdown */}
              {/* Removed: food suggestions dropdown and loading indicator */}
            </div>
            <input
              value={foodNote}
              onChange={(e) => setFoodNote(e.target.value)}
              className="rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
              placeholder="Optional note"
            />
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={addFoodItem}
                className="rounded-full bg-brand px-4 py-2 text-white hover:opacity-90 transition-colors"
              >
                Add dish
              </button>
            </div>
          </div>

          {foodViewMode === "list" ? (
            <ul className="mt-3 space-y-2">
              {foodItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-start justify-between gap-4 rounded-md bg-white/60 px-3 py-2"
                  draggable
                  onDragStart={(e) => onFoodDragStart(e, idx)}
                  onDragOver={onFoodDragOver}
                  onDrop={(e) => onFoodDrop(e, idx)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-medium text-sm">
                        {idx + 1}
                      </div>
                    </div>
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
                      <div className="w-14 h-14 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">🍳</div>
                    )}
                    <div>
                      <div className="font-medium">{it.title}</div>
                      {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFoodItem(it.id)}
                    className="text-sm text-rose-500"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {foodItems.map((it, idx) => (
                <div
                  key={it.id}
                  className="rounded-md bg-white/60 p-3 flex flex-col gap-2"
                  draggable
                  onDragStart={(e) => onFoodDragStart(e, idx)}
                  onDragOver={onFoodDragOver}
                  onDrop={(e) => onFoodDrop(e, idx)}
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
                      <div className="w-16 h-16 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">🍳</div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{it.title}</div>
                      {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => removeFoodItem(it.id)} className="text-sm text-rose-500">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveFoodList}
              className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors active:translate-y-px"
            >
              {existingList ? "Update Food List" : "Create Food List"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== ANYTHING MODULE COMPONENT ==========
    function anythingModuleJSX() {
    return (
      <div className="w-full rounded-xl bg-white/80 p-6 shadow-soft transition-transform duration-200 ease-out transform motion-safe:translate-y-0">
        <label className="block mb-3 text-sm font-medium">Name your list</label>
        <input
          value={anythingTitle}
          onChange={(e) => setAnythingTitle(e.target.value)}
          className="w-full rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 pr-10 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
          placeholder="Travel destinations, Baby names, Group activities, etc."
        />
        <p className="text-sm text-zinc-500 mt-1">
          Add anything you want — Choosie will help you decide together.
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Start building</label>
            <div className="flex items-center gap-2">
              {/* list view button */}
              <button
                type="button"
                title="List view"
                aria-pressed={anythingViewMode === "list"}
                onClick={() => setAnythingViewMode("list")}
                className={`p-1 rounded-md ${anythingViewMode === "list" ? "bg-white/90 shadow" : "hover:bg-white/40"}`}
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
                aria-pressed={anythingViewMode === "grid"}
                onClick={() => setAnythingViewMode("grid")}
                className={`p-1 rounded-md ${anythingViewMode === "grid" ? "bg-white/90 shadow" : "hover:bg-white/40"}`}
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
                value={anythingInput}
                onChange={(e) => setAnythingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAnythingItem();
                  }
                }}
                className="w-full rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
                placeholder="Item name"
              />
            </div>
            <input
              value={anythingNote}
              onChange={(e) => setAnythingNote(e.target.value)}
              className="rounded-xl border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3 py-2 shadow-inner focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand placeholder:text-zinc-400"
              placeholder="Optional note"
            />
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={addAnythingItem}
                className="rounded-full bg-brand px-4 py-2 text-white hover:opacity-90 transition-colors"
              >
                Add item
              </button>
            </div>
          </div>

          {/* No AI suggestions for Anything lists - they're too generic */}
          <div className="mt-4 rounded-lg bg-white/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Build your list</h3>
            </div>
            <p className="text-xs text-zinc-500">Add items manually to create your custom list. Use the narrowing process to decide together!</p>
          </div>

          {anythingViewMode === "list" ? (
            <ul className="mt-3 space-y-2">
              {anythingItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-start justify-between gap-4 rounded-md bg-white/60 px-3 py-2"
                  draggable
                  onDragStart={(e) => onAnythingDragStart(e, idx)}
                  onDragOver={onAnythingDragOver}
                  onDrop={(e) => onAnythingDrop(e, idx)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-medium text-sm">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="cursor-grab text-zinc-400" title="Drag to reorder" aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                        <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                      </svg>
                    </div>
                    <div className="w-14 h-14 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">✨</div>
                    <div>
                      <div className="font-medium">{it.title}</div>
                      {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeAnythingItem(it.id)}
                    className="text-sm text-rose-500"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {anythingItems.map((it, idx) => (
                <div
                  key={it.id}
                  className="rounded-md bg-white/60 p-3 flex flex-col gap-2"
                  draggable
                  onDragStart={(e) => onAnythingDragStart(e, idx)}
                  onDragOver={onAnythingDragOver}
                  onDrop={(e) => onAnythingDrop(e, idx)}
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
                    <div className="w-16 h-16 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">✨</div>
                    <div className="flex-1">
                      <div className="font-medium">{it.title}</div>
                      {it.notes && <div className="text-xs text-zinc-500">{it.notes}</div>}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => removeAnythingItem(it.id)} className="text-sm text-rose-500">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveAnythingList}
              className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors active:translate-y-px"
            >
              {existingList ? "Update List" : "Create List"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}