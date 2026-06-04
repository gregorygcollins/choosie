"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ListForm from "../../components/ListForm";
import BookForm from "../../components/BookForm";
import { upsertList, getList, removeList } from "../../lib/storage";
import type { ChoosieList, ChoosieItem } from "../../components/ListForm";
import type { BookSearchResult } from "../../lib/googleBooks";
import type { SpotifyTrack } from "../../lib/spotify";
import ModuleSelector from "../../components/ModuleSelector";
import { requestChoosieInstallPrompt } from "../../components/InstallChoosiePrompt";

// simple unique id helper
function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function getModuleTheme(module: string) {
  if (module === "books") {
    return {
      pageBg: "bg-blue-50/70 ring-1 ring-blue-100/80",
      createBtn: "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700",
      addBtn: "rounded-xl bg-blue-100 px-5 py-2 font-semibold text-blue-800 transition hover:bg-blue-200",
    };
  }

  if (module === "music") {
    return {
      pageBg: "bg-violet-50/70 ring-1 ring-violet-100/80",
      createBtn: "bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700",
      addBtn: "rounded-xl bg-violet-100 px-5 py-2 font-semibold text-violet-800 transition hover:bg-violet-200",
    };
  }

  if (module === "food") {
    return {
      pageBg: "bg-emerald-50/70 ring-1 ring-emerald-100/80",
      createBtn: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700",
      addBtn: "rounded-xl bg-emerald-100 px-5 py-2 font-semibold text-emerald-800 transition hover:bg-emerald-200",
    };
  }

  if (module === "anything") {
    return {
      pageBg: "bg-rose-50/70 ring-1 ring-rose-100/80",
      createBtn: "bg-rose-600 text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700",
      addBtn: "rounded-xl bg-rose-100 px-5 py-2 font-semibold text-rose-800 transition hover:bg-rose-200",
    };
  }

  return {
    pageBg: "bg-teal-50/60 ring-1 ring-teal-100/80",
    createBtn: "bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700",
    addBtn: "rounded-xl bg-teal-50 px-5 py-2 font-semibold text-teal-800 ring-1 ring-teal-100 transition hover:bg-teal-100",
  };
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
  const [bookDescription, setBookDescription] = useState("");
  const [bookSearchInput, setBookSearchInput] = useState("");  // Book search field
  const [bookItems, setBookItems] = useState<ChoosieItem[]>([]);
  const [bookNote, setBookNote] = useState("");
  const [bookSugs, setBookSugs] = useState<BookSearchResult[]>([]);
  const [bookSugsLoading, setBookSugsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Music list state
  const [musicListTitle, setMusicListTitle] = useState("");  // List name
  const [musicDescription, setMusicDescription] = useState("");
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
  const [foodDescription, setFoodDescription] = useState("");
  const [foodInput, setFoodInput] = useState("");
  const [foodItems, setFoodItems] = useState<ChoosieItem[]>([]);
  const [foodNote, setFoodNote] = useState("");
  const [foodSugs, setFoodSugs] = useState<Array<{ id: number; title: string; image?: string | null }>>([]);
  const [foodSugsLoading, setFoodSugsLoading] = useState(false);
  const [foodViewMode, setFoodViewMode] = useState<"list" | "grid">("list");
  const [foodDragIndex, setFoodDragIndex] = useState<number | null>(null);

  // Anything list state (no API search, manual entry only)
  const [anythingTitle, setAnythingTitle] = useState("");
  const [anythingDescription, setAnythingDescription] = useState("");
  const [anythingItems, setAnythingItems] = useState<ChoosieItem[]>([]);
  const [anythingInput, setAnythingInput] = useState("");
  const [anythingNote, setAnythingNote] = useState("");
  const [anythingViewMode, setAnythingViewMode] = useState<"list" | "grid">("list");
  const [anythingDragIndex, setAnythingDragIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<{ module: "books" | "music" | "food" | "anything"; id: string } | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const [editingItemNote, setEditingItemNote] = useState("");
  const moduleTheme = getModuleTheme(selectedModule);

  useEffect(() => {
    if (!editId) return;
    
    let cancelled = false;
    
    async function loadListForEdit() {
      // Try server first (for signed-in users with server-persisted lists)
      try {
        const res = await fetch("/api/choosie/getList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ listId: editId }),
        });
        
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.ok && data.list) {
            const list = data.list;
            applyListToState(list);
            return;
          }
        }
      } catch (err) {
        console.error("Server fetch failed, trying local storage:", err);
      }
      
      // Fallback to local storage
      if (!cancelled) {
        const list = getList(editId as string);
        if (list) {
          applyListToState(list);
        }
      }
    }
    
    function applyListToState(list: ChoosieList) {
      if (list.moduleType === "books") {
        setSelectedModule("books");
        setBookListTitle(list.title);
        setBookDescription(list.description || "");
        setBookItems(list.items);
        setExistingList(list);
      } else if (list.moduleType === "music") {
        setSelectedModule("music");
        setMusicListTitle(list.title);
        setMusicDescription(list.description || "");
        setMusicItems(list.items);
        setExistingList(list);
      } else if (list.moduleType === "food") {
        setSelectedModule("food");
        setFoodTitle(list.title);
        setFoodDescription(list.description || "");
        setFoodItems(list.items);
        setExistingList(list);
      } else if (list.moduleType === "anything") {
        setSelectedModule("anything");
        setAnythingTitle(list.title);
        setAnythingDescription(list.description || "");
        setAnythingItems(list.items);
        setExistingList(list);
      } else {
        // Default to movies module for existing watchlists
        setSelectedModule("movies");
        setExistingList(list);
      }
    }
    
    loadListForEdit();
    
    return () => {
      cancelled = true;
    };
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

  function navigateToCreatedList(data: any, fallbackList: ChoosieList) {
    const serverList = data?.list || null;
    const serverId = serverList?.id || data?.listId;

    if (!serverId) return false;

    const createdList: ChoosieList = {
      ...fallbackList,
      ...serverList,
      id: serverId,
      moduleType: serverList?.moduleType || fallbackList.moduleType,
      description: serverList?.description || fallbackList.description,
      items: serverList?.items || fallbackList.items,
      createdAt: serverList?.createdAt || fallbackList.createdAt,
    };

    upsertList(createdList);
    if (serverId !== fallbackList.id) {
      removeList(fallbackList.id);
    }
    openCreatedList(serverId);
    return true;
  }

  function openCreatedList(listId: string) {
    requestChoosieInstallPrompt();
    router.push(`/list/${listId}`);
  }

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
    
    // If editing an existing list, update it on the server if user is signed in
    if (existingList) {
      if (me && (me as any).id) {
        const payload = {
          listId: list.id,
          title: listWithModule.title,
          description: listWithModule.description,
          items: (listWithModule.items || []).map((it: any) => ({
            id: it.id,
            title: it.title,
            notes: it.notes,
            image: it.image,
          })),
        };
        fetch(`/api/choosie/updateList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              if (data?.ok && data?.list) {
                // Update localStorage with server response to keep them in sync
                upsertList(data.list);
              }
            }
          })
          .catch((err) => {
            console.error("Failed to update list on server:", err);
            // Continue anyway - we have the localStorage update
          });
      }
      router.push(`/list/${list.id}`);
      return;
    }
    
    // If signed in and creating a NEW list, persist to server so it appears across devices
    if (me && (me as any).id) {
      const payload = {
        title: listWithModule.title,
        description: listWithModule.description,
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
          if (data?.ok && navigateToCreatedList(data, listWithModule)) {
            return;
          }
          openCreatedList(list.id);
        })
        .catch(() => {
          // fall back to local view on failure
          openCreatedList(list.id);
        });
    } else {
      openCreatedList(list.id);
    }
  }

  function handleSelectModule(moduleId: string) {
    setSelectedModule(moduleId);
    // Reset book state
    setBookListTitle("");
    setBookDescription("");
    setBookSearchInput("");
    setBookItems([]);
    setBookNote("");
    // Reset music state
    setMusicListTitle("");
    setMusicDescription("");
    setMusicSearchInput("");
    setMusicItems([]);
    setMusicNote("");
    setMusicAlbumArt(undefined);
    // Reset food state
    setFoodTitle("");
    setFoodDescription("");
    setFoodItems([]);
    setFoodNote("");
    // Reset anything state
    setAnythingTitle("");
    setAnythingDescription("");
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

  function openModuleItemEditor(module: "books" | "music" | "food" | "anything", item: ChoosieItem) {
    setEditingItem({ module, id: item.id });
    setEditingItemTitle(item.title || "");
    setEditingItemNote(item.notes || "");
  }

  function saveModuleItemEdit() {
    if (!editingItem) return;
    const title = editingItemTitle.trim();
    const notes = editingItemNote.trim();
    if (!title) {
      alert("Give this entry a title before saving.");
      return;
    }
    const currentItems =
      editingItem.module === "books"
        ? bookItems
        : editingItem.module === "music"
        ? musicItems
        : editingItem.module === "food"
        ? foodItems
        : anythingItems;
    const duplicate = currentItems.find(
      (item) => item.id !== editingItem.id && item.title.toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      alert(`"${title}" has already been added to your list.`);
      return;
    }

    const updateItems = (items: ChoosieItem[]) => {
      return items.map((item) =>
        item.id === editingItem.id ? { ...item, title, notes: notes || undefined } : item
      );
    };

    if (editingItem.module === "books") setBookItems(updateItems);
    if (editingItem.module === "music") setMusicItems(updateItems);
    if (editingItem.module === "food") setFoodItems(updateItems);
    if (editingItem.module === "anything") setAnythingItems(updateItems);
    setEditingItem(null);
    setEditingItemTitle("");
    setEditingItemNote("");
  }

  function renderEditItemButton(module: "books" | "music" | "food" | "anything", item: ChoosieItem) {
    return (
      <button
        type="button"
        onClick={() => openModuleItemEditor(module, item)}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-zinc-500 transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/30 active:translate-y-px"
        title="Edit item"
        aria-label={`Edit ${item.title}`}
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
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
    );
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
      description: bookDescription.trim() || undefined,
      moduleType: "books",
      items: bookItems,
      createdAt: existingList?.createdAt || new Date().toISOString(),
    };

    if (existingList) {
      handleSave(list);
      return;
    }

    upsertList(list);

    if (me?.id) {
      const payload = {
        title: list.title,
        description: list.description,
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
          if (data?.ok && navigateToCreatedList(data, list)) return;
          return openCreatedList(list.id);
        })
        .catch(() => openCreatedList(list.id));
    } else {
      openCreatedList(list.id);
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
      description: musicDescription.trim() || undefined,
      moduleType: "music",
      items: musicItems,
      createdAt: existingList?.createdAt || new Date().toISOString(),
    };

    if (existingList) {
      handleSave(list);
      return;
    }

    upsertList(list);

    if (me?.id) {
      const payload = {
        title: list.title,
        description: list.description,
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
          if (data?.ok && navigateToCreatedList(data, list)) return;
          return openCreatedList(list.id);
        })
        .catch(() => openCreatedList(list.id));
    } else {
      openCreatedList(list.id);
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
      description: foodDescription.trim() || undefined,
      moduleType: "food",
      items: foodItems,
      createdAt: existingList?.createdAt || new Date().toISOString(),
    };

    if (existingList) {
      handleSave(list);
      return;
    }

    upsertList(list);

    if (me?.id) {
      const payload = {
        title: list.title,
        description: list.description,
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
          if (data?.ok && navigateToCreatedList(data, list)) return;
          return openCreatedList(list.id);
        })
        .catch(() => openCreatedList(list.id));
    } else {
      openCreatedList(list.id);
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
      description: anythingDescription.trim() || undefined,
      moduleType: "anything",
      items: anythingItems,
      createdAt: existingList?.createdAt || new Date().toISOString(),
    };

    if (existingList) {
      handleSave(list);
      return;
    }

    upsertList(list);

    if (me?.id) {
      const payload = {
        title: list.title,
        description: list.description,
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
          if (data?.ok && navigateToCreatedList(data, list)) return;
          return openCreatedList(list.id);
        })
        .catch(() => openCreatedList(list.id));
    } else {
      openCreatedList(list.id);
    }
  }

  return (
    <>
      {!existingList && (
        <ModuleSelector 
          userIsPro={me?.isPro || false} 
          selectedModule={selectedModule}
          onSelectModule={handleSelectModule}
        />
      )}

      <div className={["mt-4 rounded-2xl p-2 transition-colors duration-300 sm:mt-5 sm:p-3", moduleTheme.pageBg].join(" ")}>
      {selectedModule === "books" ? (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 pb-24 fade-in sm:gap-5 sm:pb-0">
          {/* List name panel */}
          <div className="card panel-tier-2 p-3 transition-transform duration-200 sm:p-4 sm:hover:-translate-y-0.5">
            <label className="block text-sm font-medium text-neutral-700 mb-2">{existingList ? "Rename" : "Name your booklist"}</label>
            <input
              value={bookListTitle}
              onChange={(e) => setBookListTitle(e.target.value)}
              className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
              placeholder="Book club, Reading group, etc."
            />
            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Notes</label>
            <textarea
              value={bookDescription}
              onChange={(e) => setBookDescription(e.target.value)}
              className="input-soft min-h-16 w-full resize-y text-[0.95rem] placeholder-[#7A7A7A] sm:min-h-20"
            />
          </div>
          {/* Add items panel */}
          <div className={`card panel-tier-3 relative overflow-visible p-3 transition-transform duration-200 sm:p-4 sm:hover:-translate-y-0.5 ${bookSugs.length > 0 || bookSugsLoading ? "z-[80]" : "z-10"}`}>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Add books</label>
            <div className="relative">
              <div className="flex gap-2 sm:gap-3">
                <input
                  value={bookSearchInput}
                  onChange={(e) => setBookSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBookItem(); } }}
                  className="min-w-0 flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
                  placeholder="Book title"
                />
                <button
                  onClick={addBookItem}
                  className={moduleTheme.addBtn}
                  title="Add book"
                  aria-label="Add book"
                >
                  +
                </button>
              </div>
              {/* Book suggestions dropdown */}
              {(bookSugs.length > 0 || bookSugsLoading) && (
                <div className="absolute z-[9999] mt-2 w-full suggestion-menu max-h-64 overflow-auto fade-in">
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
                        <div className="font-medium text-[#F8F9FF] truncate">{book.title}</div>
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
            <div className="card panel-tier-1 p-3 sm:p-4">
              <label className="block text-sm font-medium text-neutral-700 mb-3">Your books</label>
              <ul className="space-y-3">
                {bookItems.map((it, idx) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-2 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md sm:gap-4"
                    draggable
                    onDragStart={(e) => onBookDragStart(e, idx)}
                    onDragOver={onBookDragOver}
                    onDrop={(e) => onBookDrop(e, idx)}
                  >
                    <div className="flex h-9 w-7 shrink-0 items-center justify-center rounded-full text-brand/55" aria-hidden="true">
                      <span className="grid gap-0.5">
                        <span className="h-1 w-1 rounded-full bg-current" />
                        <span className="h-1 w-1 rounded-full bg-current" />
                        <span className="h-1 w-1 rounded-full bg-current" />
                      </span>
                    </div>
                    {it.image ? (
                      <img src={it.image} alt={it.title} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/60 text-zinc-400">📚</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-neutral-800">{it.title}</div>
                      {it.notes && <div className="line-clamp-2 text-xs text-neutral-500">{it.notes}</div>}
                    </div>
                    {renderEditItemButton("books", it)}
                    <button
                      onClick={() => removeBookItem(it.id)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-red-600 transition-colors hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 active:translate-y-px"
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
          <div className="sticky bottom-4 z-40 -mx-1 flex justify-center rounded-full bg-white/85 p-2 shadow-soft backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <button
              onClick={handleSaveBookList}
              className={["w-full rounded-full px-8 py-3 text-[1.05rem] font-semibold transition sm:w-auto", moduleTheme.createBtn].join(" ")}
            >
              {existingList ? "Update Book List" : "Create"}
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
        <ListForm
          onSave={handleSave}
          existingList={existingList}
          createButtonClassName={moduleTheme.createBtn}
          addButtonClassName={moduleTheme.addBtn}
        />
      )}
      </div>
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="module-item-edit-title"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Edit entry</p>
                <h2 id="module-item-edit-title" className="mt-1 text-2xl font-semibold text-brand">
                  Update this item
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
                title="Close editor"
                aria-label="Close editor"
              >
                x
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="module-edit-item-title" className="block text-sm font-semibold text-brand">
                  Title
                </label>
                <input
                  id="module-edit-item-title"
                  value={editingItemTitle}
                  onChange={(event) => setEditingItemTitle(event.target.value)}
                  className="input-soft mt-2 w-full text-[1rem]"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="module-edit-item-notes" className="block text-sm font-semibold text-brand">
                  Notes
                </label>
                <textarea
                  id="module-edit-item-notes"
                  value={editingItemNote}
                  onChange={(event) => setEditingItemNote(event.target.value)}
                  className="input-soft mt-2 min-h-28 w-full resize-y text-[0.95rem]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveModuleItemEdit}
                className="rounded-full bg-consensus px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-consensus-dark"
              >
                Save entry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ========== KARAOKE MODULE COMPONENT ==========
    function musicModuleJSX() {
    return (
  <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 pb-24 fade-in sm:gap-5 sm:pb-0">
        {/* List name panel */}
        <div className="card panel-tier-2 p-3 transition-transform duration-200 sm:p-4 sm:hover:-translate-y-0.5">
          <label className="block text-sm font-medium text-neutral-700 mb-2">{existingList ? "Rename" : "Name your music list"}</label>
          <input
            value={musicListTitle}
            onChange={(e) => setMusicListTitle(e.target.value)}
            className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
            placeholder="Karaoke night, Roadtrip, etc."
          />
          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Notes</label>
          <textarea
            value={musicDescription}
            onChange={(e) => setMusicDescription(e.target.value)}
            className="input-soft min-h-16 w-full resize-y text-[0.95rem] placeholder-[#7A7A7A] sm:min-h-20"
          />
        </div>
        {/* Add items panel */}
        <div className={`card panel-tier-3 relative overflow-visible p-3 transition-transform duration-200 sm:p-4 sm:hover:-translate-y-0.5 ${musicSugs.length > 0 || musicSugsLoading ? "z-[80]" : "z-10"}`}>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Add songs</label>
          <div className="relative">
            <div className="flex gap-2 sm:gap-3">
              <input
                value={musicSearchInput}
                onChange={(e) => setMusicSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMusicItem(); } }}
                className="min-w-0 flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
                placeholder="Song title"
              />
              <button
                onClick={addMusicItem}
                className={moduleTheme.addBtn}
                title="Add song"
                aria-label="Add song"
              >
                +
              </button>
            </div>
            {/* Music suggestions dropdown */}
            {(musicSugs.length > 0 || musicSugsLoading) && (
              <div className="absolute z-[9999] mt-2 w-full suggestion-menu max-h-64 overflow-auto fade-in">
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
                      <div className="font-medium text-[#F8F9FF] truncate">{track.name}</div>
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
          <div className="card panel-tier-1 p-3 sm:p-4">
            <label className="block text-sm font-medium text-neutral-700 mb-3">Your songs</label>
            <ul className="space-y-3">
              {musicItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-center gap-2 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md sm:gap-4"
                  draggable
                  onDragStart={(e) => onMusicDragStart(e, idx)}
                  onDragOver={onMusicDragOver}
                  onDrop={(e) => onMusicDrop(e, idx)}
                >
                  <div className="flex h-9 w-7 shrink-0 items-center justify-center rounded-full text-brand/55" aria-hidden="true">
                    <span className="grid gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </span>
                  </div>
                  {it.image ? (
                    <img src={it.image} alt={it.title} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/60 text-zinc-400">🎵</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-neutral-800">{it.title}</div>
                    {it.notes && <div className="line-clamp-2 text-xs text-neutral-500">{it.notes}</div>}
                  </div>
                  {renderEditItemButton("music", it)}
                  <button
                    onClick={() => removeMusicItem(it.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-red-600 transition-colors hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 active:translate-y-px"
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
        <div className="sticky bottom-4 z-40 -mx-1 flex justify-center rounded-full bg-white/85 p-2 shadow-soft backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <button
            onClick={handleSaveMusicList}
            className={["w-full rounded-full px-8 py-3 text-[1.05rem] font-semibold transition sm:w-auto", moduleTheme.createBtn].join(" ")}
          >
            {existingList ? "Update Music List" : "Create"}
          </button>
        </div>
      </div>
    );
  }

  // ========== FOOD MODULE COMPONENT ==========
    function foodModuleJSX() {
    return (
  <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 pb-24 fade-in sm:gap-5 sm:pb-0">
        {/* List name panel */}
        <div className="card panel-tier-2 p-3 transition-transform duration-200 sm:p-4 sm:hover:-translate-y-0.5">
          <label className="block text-sm font-medium text-neutral-700 mb-2">{existingList ? "Rename" : "Name your food list"}</label>
          <input
            value={foodTitle}
            onChange={(e) => setFoodTitle(e.target.value)}
            className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
            placeholder="Weekday dinners, Holiday dishes, etc."
          />
          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Notes</label>
          <textarea
            value={foodDescription}
            onChange={(e) => setFoodDescription(e.target.value)}
            className="input-soft min-h-16 w-full resize-y text-[0.95rem] placeholder-[#7A7A7A] sm:min-h-20"
          />
        </div>
        {/* Add items panel */}
        <div className="card panel-tier-3 p-3 transition-transform duration-200 sm:p-4 sm:hover:-translate-y-0.5">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Add dishes</label>
          <div className="flex gap-2 sm:gap-3">
            <input
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFoodItem(); } }}
              className="min-w-0 flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
              placeholder="Dish name"
            />
            <button
              onClick={addFoodItem}
              className={moduleTheme.addBtn}
              title="Add dish"
              aria-label="Add dish"
            >
              +
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
          <div className="card panel-tier-1 p-3 sm:p-4">
            <label className="block text-sm font-medium text-neutral-700 mb-3">Your dishes</label>
            <ul className="space-y-3">
              {foodItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-center gap-2 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md sm:gap-4"
                  draggable
                  onDragStart={(e) => onFoodDragStart(e, idx)}
                  onDragOver={onFoodDragOver}
                  onDrop={(e) => onFoodDrop(e, idx)}
                >
                  <div className="flex h-9 w-7 shrink-0 items-center justify-center rounded-full text-brand/55" aria-hidden="true">
                    <span className="grid gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </span>
                  </div>
                  {it.image ? (
                    <img src={it.image} alt={it.title} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/60 text-zinc-400">🍳</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-neutral-800">{it.title}</div>
                    {it.notes && <div className="line-clamp-2 text-xs text-neutral-500">{it.notes}</div>}
                  </div>
                  {renderEditItemButton("food", it)}
                  <button
                    onClick={() => removeFoodItem(it.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-red-600 transition-colors hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 active:translate-y-px"
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
        <div className="sticky bottom-4 z-40 -mx-1 flex justify-center rounded-full bg-white/85 p-2 shadow-soft backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <button
            onClick={handleSaveFoodList}
            className={["w-full rounded-full px-8 py-3 text-[1.05rem] font-semibold transition sm:w-auto", moduleTheme.createBtn].join(" ")}
          >
            {existingList ? "Update Food List" : "Create"}
          </button>
        </div>
      </div>
    );
  }

  // ========== ANYTHING MODULE COMPONENT ==========
    function anythingModuleJSX() {
    return (
  <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 pb-24 fade-in sm:gap-5 sm:pb-0">
        {/* List name panel */}
        <div className="card panel-tier-2 p-3 transition-transform duration-200 sm:p-4 sm:hover:-translate-y-0.5">
          <label className="block text-sm font-medium text-neutral-700 mb-2">{existingList ? "Rename" : "Name your list"}</label>
          <input
            value={anythingTitle}
            onChange={(e) => setAnythingTitle(e.target.value)}
            className="input-soft w-full text-[1.05rem] placeholder-[#7A7A7A]"
            placeholder="Travel destinations, Baby names, etc."
          />
          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Notes</label>
          <textarea
            value={anythingDescription}
            onChange={(e) => setAnythingDescription(e.target.value)}
            className="input-soft min-h-16 w-full resize-y text-[0.95rem] placeholder-[#7A7A7A] sm:min-h-20"
          />
        </div>
        {/* Add items panel */}
        <div className="card panel-tier-3 p-3 transition-transform duration-200 sm:p-4 sm:hover:-translate-y-0.5">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Add items</label>
          <div className="flex gap-2 sm:gap-3">
            <input
              value={anythingInput}
              onChange={(e) => setAnythingInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAnythingItem(); } }}
              className="min-w-0 flex-1 input-soft text-[1.05rem] placeholder-[#7A7A7A]"
              placeholder="Item name"
            />
            <button
              onClick={addAnythingItem}
              className={moduleTheme.addBtn}
              title="Add item"
              aria-label="Add item"
            >
              +
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
          <div className="card panel-tier-1 p-3 sm:p-4">
            <label className="block text-sm font-medium text-neutral-700 mb-3">Your items</label>
            <ul className="space-y-3">
              {anythingItems.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-center gap-2 rounded-xl bg-white/70 shadow-sm px-3 py-2 transition-all duration-300 hover:shadow-md sm:gap-4"
                  draggable
                  onDragStart={(e) => onAnythingDragStart(e, idx)}
                  onDragOver={onAnythingDragOver}
                  onDrop={(e) => onAnythingDrop(e, idx)}
                >
                  <div className="flex h-9 w-7 shrink-0 items-center justify-center rounded-full text-brand/55" aria-hidden="true">
                    <span className="grid gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </span>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/60 text-zinc-400">✨</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-neutral-800">{it.title}</div>
                    {it.notes && <div className="line-clamp-2 text-xs text-neutral-500">{it.notes}</div>}
                  </div>
                  {renderEditItemButton("anything", it)}
                  <button
                    onClick={() => removeAnythingItem(it.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-red-600 transition-colors hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 active:translate-y-px"
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
        <div className="sticky bottom-4 z-40 -mx-1 flex justify-center rounded-full bg-white/85 p-2 shadow-soft backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <button
            onClick={handleSaveAnythingList}
            className={["w-full rounded-full px-8 py-3 text-[1.05rem] font-semibold transition sm:w-auto", moduleTheme.createBtn].join(" ")}
          >
            {existingList ? "Update List" : "Create"}
          </button>
        </div>
      </div>
    );
  }
}
