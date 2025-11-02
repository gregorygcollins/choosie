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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedBookResult, setSelectedBookResult] = useState<BookSearchResult | null>(null);
  const [bookNote, setBookNote] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Music list state
  const [musicTitle, setMusicTitle] = useState("");
  const [musicItems, setMusicItems] = useState<ChoosieItem[]>([]);
  const [musicInput, setMusicInput] = useState("");
  const [musicNote, setMusicNote] = useState("");
  const [musicAlbumArt, setMusicAlbumArt] = useState<string | undefined>(undefined);
  const [musicSearchResults, setMusicSearchResults] = useState<SpotifyTrack[]>([]);
  const [musicSearchLoading, setMusicSearchLoading] = useState(false);
  const [showMusicResults, setShowMusicResults] = useState(false);
  const [musicAiSuggestions, setMusicAiSuggestions] = useState<any[]>([]);
  const [musicAiLoading, setMusicAiLoading] = useState(false);
  const [musicViewMode, setMusicViewMode] = useState<"list" | "grid">("list");
  const [musicDragIndex, setMusicDragIndex] = useState<number | null>(null);

  // Food list state
  const [foodTitle, setFoodTitle] = useState("");
  const [foodItems, setFoodItems] = useState<ChoosieItem[]>([]);
  const [foodInput, setFoodInput] = useState("");
  const [foodNote, setFoodNote] = useState("");
  const [foodAiSuggestions, setFoodAiSuggestions] = useState<any[]>([]);
  const [foodAiLoading, setFoodAiLoading] = useState(false);
  const [foodViewMode, setFoodViewMode] = useState<"list" | "grid">("list");
  const [foodDragIndex, setFoodDragIndex] = useState<number | null>(null);

  // Starter ideas for Food when tailored suggestions aren't available yet
  const DEFAULT_FOOD_SUGGESTIONS: Array<{ title: string; reason?: string }> = [
    { title: "Taco night", reason: "Build-your-own and crowd-pleaser" },
    { title: "Stir-fry", reason: "Fast, flexible, great with veggies" },
    { title: "Sheet‑pan chicken", reason: "Easy, minimal cleanup" },
    { title: "Pasta al limone", reason: "Bright, simple, comforting" },
    { title: "Burgers + oven fries", reason: "Weeknight classic" },
    { title: "Thai curry", reason: "Cozy and customizable heat" },
    { title: "Grain bowl", reason: "Healthy base with fun toppings" },
    { title: "Homemade pizza", reason: "Everyone picks a topping" },
    { title: "Chili", reason: "Make-ahead and feeds a crowd" },
    { title: "Fajitas", reason: "Sizzle factor, quick on the stove" },
    { title: "Ramen upgrade", reason: "Quick broth + add‑ins" },
    { title: "Salmon + greens", reason: "Light and weeknight easy" },
  ];

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

  // Book search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || selectedModule !== "books") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/books/search?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.books || []);
          setShowSearchResults((data.books || []).length > 0);
        }
      } catch (err) {
        console.error("Book search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedModule]);

  // Spotify search with debounce
  useEffect(() => {
    if (!musicInput.trim() || selectedModule !== "music") {
      setMusicSearchResults([]);
      setShowMusicResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setMusicSearchLoading(true);
      try {
        const res = await fetch(`/api/spotify/search?query=${encodeURIComponent(musicInput)}`);
        if (res.ok) {
          const data = await res.json();
          setMusicSearchResults(data.tracks || []);
          setShowMusicResults((data.tracks || []).length > 0);
        }
      } catch (err) {
        console.error("Spotify search error:", err);
      } finally {
        setMusicSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [musicInput, selectedModule]);

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
  setSelectedBookResult(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setBookNote("");
    setAiSuggestions([]);
    // Reset music state
    setMusicTitle("");
    setMusicItems([]);
    setMusicInput("");
    setMusicNote("");
    setMusicSearchResults([]);
    setShowMusicResults(false);
    setMusicAiSuggestions([]);
    // Reset food state
    setFoodTitle("");
    setFoodItems([]);
    setFoodInput("");
    setFoodNote("");
    setFoodAiSuggestions([]);
    // Reset anything state
    setAnythingTitle("");
    setAnythingItems([]);
    setAnythingInput("");
    setAnythingNote("");
  }

  function selectBookSuggestion(book: BookSearchResult) {
    setSearchQuery(book.title);
    setBookNote(book.description || "");
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedBookResult(book);
  }

  function selectSpotifyTrack(track: SpotifyTrack) {
    setMusicInput(`${track.name} - ${track.artists.join(", ")}`);
    setMusicNote(track.album || "");
    setMusicAlbumArt(track.albumArt);
    setMusicSearchResults([]);
    setShowMusicResults(false);
  }

  function addBookItem() {
    if (!searchQuery.trim()) return;
    
    const title = searchQuery.trim();
    const duplicate = bookItems.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );
    
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }

  // Prefer an explicitly selected result (set by selectBookSuggestion). If not set, try to match the title from the current searchResults.
  const selectedBook = selectedBookResult || searchResults.find(b => b.title === searchQuery);
    
    setBookItems((s) => [
      ...s,
      { 
        id: id(), 
        title, 
        notes: bookNote?.trim() || undefined, 
        image: selectedBook?.thumbnail || undefined 
      },
    ]);
    setSearchQuery("");
    setBookNote("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedBookResult(null);
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

  async function loadAiSuggestionsForBooks() {
    setAiLoading(true);
    try {
      const payload: any = { limit: 12 };
      if (existingList?.id) payload.listId = existingList.id;
      else payload.items = bookItems.map((it) => it.title);
      const res = await fetch(`/api/choosie/getSuggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) setAiSuggestions(data.suggestions || []);
      else throw new Error(data.error || "Failed to load suggestions");
    } catch (e) {
      console.error(e);
      alert("Couldn't load suggestions right now. Try again soon.");
    } finally {
      setAiLoading(false);
    }
  }

  function addFromAiSuggestion(s: any) {
    const title = String(s.title || "").trim();
    if (!title) return;
    const duplicate = bookItems.find((it) => it.title.toLowerCase() === title.toLowerCase());
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }
    setBookItems((curr) => [...curr, { id: id(), title, notes: s.reason, image: s.image || undefined }]);
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
    if (!musicInput.trim()) return;
    
    const title = musicInput.trim();
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
    setMusicInput("");
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

  async function loadAiSuggestionsForMusic() {
    setMusicAiLoading(true);
    try {
      const payload: any = { limit: 12 };
      if (existingList?.id) payload.listId = existingList.id;
      else payload.items = musicItems.map((it) => it.title);
      const res = await fetch(`/api/choosie/getSuggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) setMusicAiSuggestions(data.suggestions || []);
      else throw new Error(data.error || "Failed to load suggestions");
    } catch (e) {
      console.error(e);
      alert("Couldn't load suggestions right now. Try again soon.");
    } finally {
      setMusicAiLoading(false);
    }
  }

  function addFromMusicAiSuggestion(s: any) {
    const title = String(s.title || "").trim();
    if (!title) return;
    const duplicate = musicItems.find((it) => it.title.toLowerCase() === title.toLowerCase());
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }
    setMusicItems((curr) => [...curr, { id: id(), title, notes: s.reason }]);
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
    if (!foodInput.trim()) return;
    
    const title = foodInput.trim();
    const duplicate = foodItems.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );
    
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }
    
    setFoodItems((s) => [
      ...s,
      { 
        id: id(), 
        title, 
        notes: foodNote?.trim() || undefined
      },
    ]);
    setFoodInput("");
    setFoodNote("");
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

  async function loadAiSuggestionsForFood() {
    setFoodAiLoading(true);
    try {
      // Call dedicated food suggestions endpoint and pass existing item titles
      const payload = {
        listId: existingList?.id,
        items: foodItems.map((it) => it.title),
        limit: 12,
      };
      const res = await fetch(`/api/food/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        const suggestions = (data.suggestions || []) as any[];
        setFoodAiSuggestions(suggestions.length ? suggestions : DEFAULT_FOOD_SUGGESTIONS);
      } else {
        setFoodAiSuggestions(DEFAULT_FOOD_SUGGESTIONS);
      }
    } catch (e) {
      console.error(e);
      setFoodAiSuggestions(DEFAULT_FOOD_SUGGESTIONS);
    } finally {
      setFoodAiLoading(false);
    }
  }

  function addFromFoodAiSuggestion(s: any) {
    const title = String(s.title || "").trim();
    if (!title) return;
    const duplicate = foodItems.find((it) => it.title.toLowerCase() === title.toLowerCase());
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }
    setFoodItems((curr) => [...curr, { id: id(), title, notes: s.reason }]);
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // If the user types after selecting, clear the explicit selection
                    setSelectedBookResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBookItem();
                    }
                    if (e.key === "Escape") {
                      setShowSearchResults(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true);
                  }}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Book title or author"
                />
                {selectedBookResult?.thumbnail && (
                  <img src={selectedBookResult.thumbnail} alt={selectedBookResult.title} className="w-12 h-16 object-cover rounded" />
                )}
                </div>
                {/* Book suggestions dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {searchResults.slice(0, 5).map((book, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectBookSuggestion(book)}
                        className="w-full flex items-start gap-3 p-3 hover:bg-zinc-50 transition-colors text-left"
                      >
                        {book.thumbnail ? (
                          <img src={book.thumbnail} alt={book.title} className="w-12 h-18 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-18 bg-zinc-100 rounded flex items-center justify-center text-zinc-400 text-xs">No cover</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{book.title}</div>
                          {book.authors.length > 0 && <div className="text-xs text-zinc-500">{book.authors.join(", ")}</div>}
                          {book.publishedYear && <div className="text-xs text-zinc-500">{book.publishedYear}</div>}
                          {book.description && (
                            <div className="text-xs text-zinc-600 mt-1 line-clamp-2">{book.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchLoading && (
                  <div className="absolute right-3 top-3 text-xs text-zinc-400">Searching...</div>
                )}
              </div>
              <input
                value={bookNote}
                onChange={(e) => setBookNote(e.target.value)}
                className="rounded-lg border px-3 py-2"
                placeholder="Optional note"
              />
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={addBookItem}
                  className="rounded-full bg-brand px-4 py-2 text-white hover:opacity-90 transition-colors"
                >
                  Add book
                </button>
                <button
                  type="button"
                  onClick={() => console.log('bookItems', bookItems)}
                  className="ml-2 rounded-full border px-3 py-2 text-sm text-zinc-700 hover:bg-white"
                >
                  Debug state
                </button>
              </div>
            </div>

            {/* Suggestions panel */}
            <div className="mt-4 rounded-lg bg-white/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Suggestions</h3>
                {existingList?.id ? (
                  <button onClick={loadAiSuggestionsForBooks} className="text-sm rounded-full bg-brand px-3 py-1 text-white hover:opacity-90">
                    {aiLoading ? "Loading…" : "Get suggestions"}
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500">Save to unlock tailored suggestions</span>
                )}
              </div>
              {aiSuggestions.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {aiSuggestions.map((s, idx) => (
                    <div key={idx} className="rounded-md bg-white/60 p-3 flex gap-3">
                      {s.image ? (
                        <img src={s.image} alt={s.title} className="w-14 h-20 object-cover rounded" />
                      ) : (
                        <div className="w-14 h-20 bg-zinc-100 rounded flex items-center justify-center text-zinc-400 text-xs">No cover</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.title}</div>
                        {s.reason && <div className="text-xs text-zinc-500 line-clamp-2">{s.reason}</div>}
                        <div className="mt-2">
                          <button onClick={() => addFromAiSuggestion(s)} className="text-xs rounded-full bg-brand px-3 py-1 text-white hover:opacity-90">
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No suggestions yet.</p>
              )}
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
                value={musicInput}
                onChange={(e) => setMusicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMusicItem();
                  }
                }}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Song title"
              />
              {/* Spotify search dropdown */}
              {showMusicResults && musicSearchResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                  {musicSearchLoading ? (
                    <div className="px-4 py-2 text-sm text-zinc-500">Searching...</div>
                  ) : (
                    musicSearchResults.slice(0, 5).map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 cursor-pointer"
                        onClick={() => selectSpotifyTrack(track)}
                      >
                        {track.albumArt ? (
                          <img src={track.albumArt} alt={track.album} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-zinc-200 flex items-center justify-center text-zinc-400">🎵</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{track.name}</div>
                          <div className="text-xs text-zinc-500 truncate">
                            {track.artists.join(", ")} {track.releaseYear && `• ${track.releaseYear}`}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <input
              value={musicNote}
              onChange={(e) => setMusicNote(e.target.value)}
              className="rounded-lg border px-3 py-2"
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

          {/* Suggestions panel */}
          <div className="mt-4 rounded-lg bg-white/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Suggestions</h3>
              {existingList?.id ? (
                <button onClick={loadAiSuggestionsForMusic} className="text-sm rounded-full bg-brand px-3 py-1 text-white hover:opacity-90">
                  {musicAiLoading ? "Loading…" : "Get suggestions"}
                </button>
              ) : (
                <span className="text-xs text-zinc-500">Save to unlock tailored suggestions</span>
              )}
            </div>
            {musicAiSuggestions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {musicAiSuggestions.map((s, idx) => (
                  <div key={idx} className="rounded-md bg-white/60 p-3">
                    <div className="font-medium truncate">{s.title}</div>
                    {s.reason && <div className="text-xs text-zinc-500 line-clamp-2">{s.reason}</div>}
                    <div className="mt-2">
                      <button onClick={() => addFromMusicAiSuggestion(s)} className="text-xs rounded-full bg-brand px-3 py-1 text-white hover:opacity-90">
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No suggestions yet.</p>
            )}
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
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFoodItem();
                  }
                }}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Dish name"
              />
            </div>
            <input
              value={foodNote}
              onChange={(e) => setFoodNote(e.target.value)}
              className="rounded-lg border px-3 py-2"
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

          {/* Suggestions panel */}
          <div className="mt-4 rounded-lg bg-white/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Suggestions</h3>
              <div className="flex items-center gap-2">
                {!existingList?.id && (
                  <span className="text-xs text-zinc-500">Starter ideas shown — save to unlock tailored picks</span>
                )}
                <button onClick={loadAiSuggestionsForFood} className="text-sm rounded-full bg-brand px-3 py-1 text-white hover:opacity-90">
                  {foodAiLoading ? "Loading…" : existingList?.id ? "Get suggestions" : "Load starter ideas"}
                </button>
              </div>
            </div>
            {(foodAiSuggestions.length > 0 ? foodAiSuggestions : DEFAULT_FOOD_SUGGESTIONS).length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(foodAiSuggestions.length > 0 ? foodAiSuggestions : DEFAULT_FOOD_SUGGESTIONS).map((s, idx) => (
                  <div key={idx} className="rounded-md bg-white/60 p-3">
                    <div className="font-medium truncate">{s.title}</div>
                    {s.reason && <div className="text-xs text-zinc-500 line-clamp-2">{s.reason}</div>}
                    <div className="mt-2">
                      <button onClick={() => addFromFoodAiSuggestion(s)} className="text-xs rounded-full bg-brand px-3 py-1 text-white hover:opacity-90">
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No suggestions yet.</p>
            )}
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
                    <div className="w-14 h-14 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">🍳</div>
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
                    <div className="w-16 h-16 rounded-md bg-white/60 flex items-center justify-center text-zinc-400">🍳</div>
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
          className="w-full rounded-lg border px-3 py-2 shadow-inner"
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
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Item name"
              />
            </div>
            <input
              value={anythingNote}
              onChange={(e) => setAnythingNote(e.target.value)}
              className="rounded-lg border px-3 py-2"
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