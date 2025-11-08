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
  const [bookListTitle, setBookListTitle] = useState("");  // List name
  const [bookSearchInput, setBookSearchInput] = useState("");  // Book search field
  const [bookItems, setBookItems] = useState<ChoosieItem[]>([]);
  const [bookNote, setBookNote] = useState("");
  const [bookSugs, setBookSugs] = useState<BookSearchResult[]>([]);
  const [bookSugsLoading, setBookSugsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Music list state
  const [musicListTitle, setMusicListTitle] = useState("");  // List name
  const [musicSearchInput, setMusicSearchInput] = useState("");  // Song search field
  const [musicItems, setMusicItems] = useState<ChoosieItem[]>([]);
  const [musicNote, setMusicNote] = useState("");
  const [musicAlbumArt, setMusicAlbumArt] = useState<string | undefined>(undefined);
  const [musicSugs, setMusicSugs] = useState<SpotifyTrack[]>([]);
  const [musicSugsLoading, setMusicSugsLoading] = useState(false);
  const [musicViewMode, setMusicViewMode] = useState<"list" | "grid">("list");
  const [musicDragIndex, setMusicDragIndex] = useState<number | null>(null);

  // Food list state
  const [foodTitle, setFoodTitle] = useState("");
  const [foodInput, setFoodInput] = useState("");
  const [foodItems, setFoodItems] = useState<ChoosieItem[]>([]);
  const [foodNote, setFoodNote] = useState("");
  const [foodSugs, setFoodSugs] = useState<Array<{ id: number; title: string; image?: string | null }>>([]);
  const [foodSugsLoading, setFoodSugsLoading] = useState(false);
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
          setBookListTitle(list.title);
          setBookItems(list.items);
        } else if (list.moduleType === "music") {
          setSelectedModule("music");
          setMusicListTitle(list.title);
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

  // Book suggestions
  useEffect(() => {
    if (selectedModule !== "books") return;
    const q = bookSearchInput.trim();
    if (q.length < 2) { setBookSugs([]); return; }
    let cancelled = false;
    setBookSugsLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/books/search?query=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => { if (!cancelled) setBookSugs((data?.books || []).slice(0,8)); })
        .catch(() => { if (!cancelled) setBookSugs([]); })
        .finally(() => { if (!cancelled) setBookSugsLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [bookSearchInput, selectedModule]);

  // Music suggestions
  useEffect(() => {
    if (selectedModule !== "music") return;
    const q = musicSearchInput.trim();
    if (q.length < 2) { setMusicSugs([]); return; }
    let cancelled = false;
    setMusicSugsLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/spotify/search?query=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => { if (!cancelled) setMusicSugs((data?.tracks || []).slice(0,8)); })
        .catch(() => { if (!cancelled) setMusicSugs([]); })
        .finally(() => { if (!cancelled) setMusicSugsLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [musicSearchInput, selectedModule]);

  // Food suggestions
  useEffect(() => {
    if (selectedModule !== "food") return;
    const q = foodInput.trim();
    if (q.length < 2) { setFoodSugs([]); return; }
    let cancelled = false;
    setFoodSugsLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/food/search?query=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => { if (!cancelled) setFoodSugs((data?.recipes || []).slice(0,8)); })
        .catch(() => { if (!cancelled) setFoodSugs([]); })
        .finally(() => { if (!cancelled) setFoodSugsLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [foodInput, selectedModule]);

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
    setBookListTitle("");
    setBookSearchInput("");
    setBookItems([]);
    setBookNote("");
    // Reset music state
    setMusicListTitle("");
    setMusicSearchInput("");
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
    const title = bookSearchInput.trim();
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
    setBookSearchInput("");
    setBookNote("");
  }

  function chooseBookSuggestion(book: BookSearchResult) {
    const title = book.title;
    const duplicate = bookItems.find((it) => it.title.toLowerCase() === title.toLowerCase());
    if (duplicate) return;
    const newItem: ChoosieItem = {
      id: id(),
      title,
      notes: (bookNote && bookNote.trim().length > 0) ? bookNote : (book.description || undefined),
      image: book.thumbnail,
    };
    setBookItems((s) => [...s, newItem]);
    setBookSearchInput("");
    setBookNote("");
    setBookSugs([]);
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
    if (!bookListTitle.trim()) {
      alert("Please add a list name");
      return;
    }
    if (bookItems.length === 0) {
      alert("Please add at least one book");
      return;
    }

    const list: ChoosieList = {
      id: existingList?.id || `book-${Date.now()}`,
      title: bookListTitle,
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
    const title = musicSearchInput.trim();
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
    setMusicSearchInput("");
    setMusicNote("");
    setMusicAlbumArt(undefined);
  }

  function chooseMusicSuggestion(track: SpotifyTrack) {
    const title = `${track.name} — ${track.artists?.[0] || ""}`.trim();
    const duplicate = musicItems.find((it) => it.title.toLowerCase() === title.toLowerCase());
    if (duplicate) return;
    const newItem: ChoosieItem = {
      id: id(),
      title,
      notes: (musicNote && musicNote.trim().length > 0) ? musicNote : [track.album, track.releaseYear].filter(Boolean).join(" · ") || undefined,
      image: track.albumArt,
    };
    setMusicItems((s) => [...s, newItem]);
    setMusicSearchInput("");
    setMusicNote("");
    setMusicAlbumArt(undefined);
    setMusicSugs([]);
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
    if (!musicListTitle.trim()) {
      alert("Please add a list name");
      return;
    }
    if (musicItems.length === 0) {
      alert("Please add at least one song");
      return;
    }

    const list: ChoosieList = {
      id: existingList?.id || `music-${Date.now()}`,
      title: musicListTitle,
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
    const title = foodInput.trim();
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
    setFoodInput("");
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

  function chooseFoodSuggestion(recipe: { id: number; title: string; image?: string | null }) {
    const title = recipe.title;
    const duplicate = foodItems.find((it) => it.title.toLowerCase() === title.toLowerCase());
    if (duplicate) return;
    const newIdVal = id();
    setFoodItems((s) => [...s, { id: newIdVal, title, notes: foodNote?.trim() || undefined, image: recipe.image || undefined }]);
    setFoodInput("");
    setFoodNote("");
    setFoodSugs([]);
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
    if (me?.id) {
      const payload = {
        title: list.title,
        moduleType: "anything",
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

  return (
    <>
      <ModuleSelector 
        userIsPro={me?.isPro || false} 
        selectedModule={selectedModule}
        onSelectModule={handleSelectModule}
      />

      {selectedModule === "books" ? (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 fade-in">
          {/* List name panel */}
          <div className="card panel-tier-2 p-4 hover:-translate-y-0.5 transition-transform duration-200">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Name your booklist</label>
            <input
              value={bookListTitle}
              onChange={(e) => setBookListTitle(e.target.value)}
              className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
              placeholder="Book club, Reading group, etc."
            />
          </div>
          {/* Add items panel */}
          <div className="card panel-tier-3 p-4 hover:-translate-y-0.5 transition-transform duration-200">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Start building</label>
            <div className="relative">
              <div className="flex gap-3">
                <input
                  value={bookSearchInput}
                  onChange={(e) => setBookSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBookItem(); } }}
                  className="flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
                  placeholder="Book title"
                />
                <button
                  onClick={addBookItem}
                  className="btn-amber px-5 py-2"
                >
                  Add book
                </button>
              </div>
              {/* Book suggestions dropdown */}
              {bookSugs.length > 0 && (
                <div className="absolute z-20 mt-2 w-full suggestion-menu max-h-64 overflow-auto fade-in">
                  {bookSugsLoading && <div className="px-3 py-2 text-sm text-neutral-300">Searching...</div>}
                  {bookSugs.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => chooseBookSuggestion(book)}
                      className="suggestion-item w-full text-left flex items-center gap-3 transition-colors"
                    >
                      {book.thumbnail && (
                        <img src={book.thumbnail} alt={book.title} className="w-10 h-14 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#F8F5EE] truncate">{book.title}</div>
                        {book.authors && book.authors.length > 0 && <div className="text-xs text-neutral-300 truncate">{book.authors.join(", ")}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              value={bookNote}
              onChange={(e) => setBookNote(e.target.value)}
              className="input-soft w-full mt-3 text-[0.95rem] placeholder-[#7A7A7A]"
              placeholder="Optional note"
            />
          </div>
          {/* Items list panel */}
          {bookItems.length > 0 && (
            <div className="card panel-tier-1 p-4">
              <label className="block text-sm font-medium text-neutral-700 mb-3">Your books</label>
              <ul className="space-y-3">
                {bookItems.map((it, idx) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-4 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md"
                    draggable
                    onDragStart={(e) => onBookDragStart(e, idx)}
                    onDragOver={onBookDragOver}
                    onDrop={(e) => onBookDrop(e, idx)}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center font-medium text-sm">{idx + 1}</div>
                    {it.image ? (
                      <img src={it.image} alt={it.title} className="w-12 h-12 rounded-md object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">📚</div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-neutral-800">{it.title}</div>
                      {it.notes && <div className="text-xs text-neutral-500">{it.notes}</div>}
                    </div>
                    <button
                      onClick={() => removeBookItem(it.id)}
                      className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors"
                    >Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Save button */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveBookList}
              className="btn-charcoal px-8 py-3 text-[1.05rem]"
            >
              {existingList ? "Update Booklist" : "Create Booklist"}
            </button>
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
  <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 fade-in">
        {/* List name panel */}
        <div className="card panel-tier-2 p-4 hover:-translate-y-0.5 transition-transform duration-200">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Name your music list</label>
          <input
            value={musicListTitle}
            onChange={(e) => setMusicListTitle(e.target.value)}
            className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
            placeholder="Karaoke night, Roadtrip, etc."
          />
        </div>
        {/* Add items panel */}
        <div className="card panel-tier-3 p-4 hover:-translate-y-0.5 transition-transform duration-200">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Start building</label>
          <div className="relative">
            <div className="flex gap-3">
              <input
                value={musicSearchInput}
                onChange={(e) => setMusicSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMusicItem(); } }}
                className="flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
                placeholder="Song title"
              />
              <button
                onClick={addMusicItem}
                className="btn-amber px-5 py-2"
              >
                Add song
              </button>
            </div>
            {/* Music suggestions dropdown */}
            {musicSugs.length > 0 && (
              <div className="absolute z-20 mt-2 w-full suggestion-menu max-h-64 overflow-auto fade-in">
                {musicSugsLoading && <div className="px-3 py-2 text-sm text-neutral-300">Searching...</div>}
                {musicSugs.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => chooseMusicSuggestion(track)}
                    className="suggestion-item w-full text-left flex items-center gap-3 transition-colors"
                  >
                    {track.albumArt && (
                      <img src={track.albumArt} alt={track.name} className="w-10 h-10 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#F8F5EE] truncate">{track.name}</div>
                      {track.artists && track.artists.length > 0 && <div className="text-xs text-neutral-300 truncate">{track.artists.join(", ")}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={musicNote}
            onChange={(e) => setMusicNote(e.target.value)}
            className="input-soft w-full mt-3 text-[0.95rem] placeholder-[#7A7A7A]"
            placeholder="Optional note"
          />
        </div>
        {/* Items list panel */}
        {musicItems.length > 0 && (
          <div className="card panel-tier-1 p-4">
            <label className="block text-sm font-medium text-neutral-700 mb-3">Your songs</label>
            <ul className="space-y-3">
              {musicItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-center gap-4 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md"
                  draggable
                  onDragStart={(e) => onMusicDragStart(e, idx)}
                  onDragOver={onMusicDragOver}
                  onDrop={(e) => onMusicDrop(e, idx)}
                >
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center font-medium text-sm">{idx + 1}</div>
                  {it.image ? (
                    <img src={it.image} alt={it.title} className="w-12 h-12 rounded-md object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">🎵</div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-neutral-800">{it.title}</div>
                    {it.notes && <div className="text-xs text-neutral-500">{it.notes}</div>}
                  </div>
                  <button
                    onClick={() => removeMusicItem(it.id)}
                    className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors"
                  >Remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Save button */}
        <div className="flex justify-center">
          <button
            onClick={handleSaveMusicList}
            className="btn-charcoal px-8 py-3 text-[1.05rem]"
          >
            {existingList ? "Update Music List" : "Create Music List"}
          </button>
        </div>
      </div>
    );
  }

  // ========== FOOD MODULE COMPONENT ==========
    function foodModuleJSX() {
    return (
  <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 fade-in">
        {/* List name panel */}
        <div className="card panel-tier-2 p-4 hover:-translate-y-0.5 transition-transform duration-200">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Name your food list</label>
          <input
            value={foodTitle}
            onChange={(e) => setFoodTitle(e.target.value)}
            className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
            placeholder="Weekday dinners, Holiday dishes, etc."
          />
        </div>
        {/* Add items panel */}
        <div className="card panel-tier-3 p-4 hover:-translate-y-0.5 transition-transform duration-200">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Start building</label>
          <div className="flex gap-3">
            <input
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFoodItem(); } }}
              className="flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
              placeholder="Dish name"
            />
            <button
              onClick={addFoodItem}
              className="btn-amber px-5 py-2"
            >
              Add dish
            </button>
          </div>
          <input
            value={foodNote}
            onChange={(e) => setFoodNote(e.target.value)}
            className="input-soft w-full mt-3 text-[0.95rem] placeholder-[#7A7A7A]"
            placeholder="Optional note"
          />
        </div>
        {/* Items list panel */}
        {foodItems.length > 0 && (
          <div className="card panel-tier-1 p-4">
            <label className="block text-sm font-medium text-neutral-700 mb-3">Your dishes</label>
            <ul className="space-y-3">
              {foodItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-center gap-4 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md"
                  draggable
                  onDragStart={(e) => onFoodDragStart(e, idx)}
                  onDragOver={onFoodDragOver}
                  onDrop={(e) => onFoodDrop(e, idx)}
                >
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center font-medium text-sm">{idx + 1}</div>
                  {it.image ? (
                    <img src={it.image} alt={it.title} className="w-12 h-12 rounded-md object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">🍳</div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-neutral-800">{it.title}</div>
                    {it.notes && <div className="text-xs text-neutral-500">{it.notes}</div>}
                  </div>
                  <button
                    onClick={() => removeFoodItem(it.id)}
                    className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors"
                  >Remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Save button */}
        <div className="flex justify-center">
          <button
            onClick={handleSaveFoodList}
            className="btn-charcoal px-8 py-3 text-[1.05rem]"
          >
            {existingList ? "Update Food List" : "Create foodlist"}
          </button>
        </div>
      </div>
    );
  }

  // ========== ANYTHING MODULE COMPONENT ==========
    function anythingModuleJSX() {
    return (
  <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 fade-in">
        {/* List name panel */}
        <div className="card panel-tier-2 p-4 hover:-translate-y-0.5 transition-transform duration-200">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Name your list</label>
          <input
            value={anythingTitle}
            onChange={(e) => setAnythingTitle(e.target.value)}
            className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
            placeholder="Travel destinations, Baby names, etc."
          />
        </div>
        {/* Add items panel */}
        <div className="card panel-tier-3 p-4 hover:-translate-y-0.5 transition-transform duration-200">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Start building</label>
          <div className="flex gap-3">
            <input
              value={anythingInput}
              onChange={(e) => setAnythingInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAnythingItem(); } }}
              className="flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
              placeholder="Item name"
            />
            <button
              onClick={addAnythingItem}
              className="btn-amber px-5 py-2"
            >
              Add item
            </button>
          </div>
          <input
            value={anythingNote}
            onChange={(e) => setAnythingNote(e.target.value)}
            className="input-soft w-full mt-3 text-[0.95rem] placeholder-[#7A7A7A]"
            placeholder="Optional note"
          />
        </div>
        {/* Items list panel */}
        {anythingItems.length > 0 && (
          <div className="card panel-tier-1 p-4">
            <label className="block text-sm font-medium text-neutral-700 mb-3">Your items</label>
            <ul className="space-y-3">
              {anythingItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-center gap-4 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md"
                  draggable
                  onDragStart={(e) => onAnythingDragStart(e, idx)}
                  onDragOver={onAnythingDragOver}
                  onDrop={(e) => onAnythingDrop(e, idx)}
                >
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center font-medium text-sm">{idx + 1}</div>
                  <div className="w-12 h-12 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">✨</div>
                  <div className="flex-1">
                    <div className="font-medium text-neutral-800">{it.title}</div>
                    {it.notes && <div className="text-xs text-neutral-500">{it.notes}</div>}
                  </div>
                  <button
                    onClick={() => removeAnythingItem(it.id)}
                    className="text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors"
                  >Remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Save button */}
        <div className="flex justify-center">
          <button
            onClick={handleSaveAnythingList}
            className="btn-charcoal px-8 py-3 text-[1.05rem]"
          >
            {existingList ? "Update List" : "Create List"}
          </button>
        </div>
      </div>
    );
  }
}