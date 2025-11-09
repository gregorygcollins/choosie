"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getList, removeList, upsertList } from "../../../lib/storage";
import { ChoosieList } from "../../../components/ListForm";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { toast } from "../../../components/Toast";
import ProcessSection from "../../../components/ProcessSection";

export default function ViewListPage() {
  const router = useRouter();
  const { id } = useParams();
  const [list, setList] = useState<ChoosieList | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sugs, setSugs] = useState<any[]>([]);
  const [sugsLoading, setSugsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [narrowingMode, setNarrowingMode] = useState<"in-person" | "virtual" | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Helper to get list type name
  const getListTypeName = () => {
    if (!list) return "list";
    const module = (list as any).moduleType
      || (String(list.id).startsWith("book-") ? "books"
          : String(list.id).startsWith("music-") ? "music"
          : String(list.id).startsWith("food-") ? "food"
          : String(list.id).startsWith("anything-") ? "anything"
          : "movies");
    if (module === "books") return "booklist";
    if (module === "food") return "food list";
    if (module === "music") return "musiclist";
    if (module === "anything") return "list";
    return "watchlist"; // default for movies
  };

  const handleNarrowClick = (mode: "in-person" | "virtual") => {
    setNarrowingMode(mode);
    setShowParticipantModal(true);
  };

  const handleParticipantSelect = (count: number) => {
    if (!list) return;
    const updated = { ...list, participants: count };
    upsertList(updated);
    setList(updated);
    setShowParticipantModal(false);
    
    // Sync to server in background
    fetch("/api/choosie/updateList", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        listId: list.id,
        participants: count,
      }),
    }).catch((err) => {
      console.error("Failed to sync participants to server:", err);
    });
    
    if (narrowingMode === "in-person") {
      router.push(`/narrow/${list.id}`);
    } else {
      router.push(`/list/${list.id}/virtual`);
    }
  };


  useEffect(() => {
    if (typeof id !== "string") return;
    let cancelled = false;

    async function load() {
      // Check localStorage first
      const localList = getList(id as string);
      
      try {
        // Try server-backed list first (requires sign-in and ownership)
        const res = await fetch("/api/choosie/getList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ listId: id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.ok && data.list) {
            // If we have a local copy, prefer it (might have unsaved edits)
            // Otherwise use server copy and save to localStorage
            if (localList) {
              setList(localList);
            } else {
              upsertList(data.list);
              setList(data.list);
            }
            setLoading(false);
            return;
          }
        }
      } catch {}
      // Fallback: local list
      if (!cancelled) {
        setList(localList || null);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function reorderInPlace(from: number, to: number) {
    setList((prev) => {
      if (!prev) return prev;
      const copy = { ...prev, items: [...prev.items] };
      if (from < 0 || from >= copy.items.length || to < 0 || to >= copy.items.length) return prev;
      const [moved] = copy.items.splice(from, 1);
      copy.items.splice(to, 0, moved);
      upsertList(copy);
      
      // Sync to server in background
      fetch("/api/choosie/updateList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listId: copy.id,
          items: copy.items.map((it: any) => ({
            id: it.id,
            title: it.title,
            notes: it.notes,
            image: it.image,
          })),
        }),
      }).catch((err) => {
        console.error("Failed to sync reorder to server:", err);
      });
      
      return copy;
    });
  }

  function onDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(index)); } catch {}
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }
  function onDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    let from = dragIndex;
    if (from == null) {
      const t = e.dataTransfer.getData("text/plain");
      const p = Number.parseInt(t, 10);
      if (!Number.isNaN(p)) from = p;
    }
    if (from != null) reorderInPlace(from, index);
    setDragIndex(null);
  }

  function handleDeleteItem(itemId: string) {
    if (!list) return;
    const updatedList = {
      ...list,
      items: list.items.filter((item) => item.id !== itemId),
    };
    upsertList(updatedList);
    setList(updatedList);
    setItemToDelete(null);
    toast("Item removed", "success");
    
    // Sync to server in background
    fetch("/api/choosie/updateList", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        listId: updatedList.id,
        items: updatedList.items.map((it: any) => ({
          id: it.id,
          title: it.title,
          notes: it.notes,
          image: it.image,
        })),
      }),
    }).catch((err) => {
      console.error("Failed to sync item deletion to server:", err);
    });
  }

  async function handleDelete() {
    if (!list) return;
    
    setIsDeleting(true);
    try {
      // Try to delete from server first
      const res = await fetch("/api/choosie/deleteList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listId: list.id }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          toast("List deleted successfully", "success");
          router.push("/lists");
          return;
        }
      }
    } catch (error) {
      console.error("Server delete failed:", error);
    }
    
    // Fallback: delete from local storage
    try {
      removeList(list.id);
      toast("List deleted", "success");
      router.push("/lists");
    } catch (error) {
      console.error("Delete failed:", error);
      toast("Failed to delete list", "error");
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-zinc-700">
          <p className="text-xl">Loading...</p>
        </div>
      </main>
    );
  }

  if (!list) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-zinc-700">
          <p className="text-xl mb-4">List not found 😢</p>
          <button
            onClick={() => router.push("/new")}
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors"
          >
            Create a new one
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
            {/* Participant Count Modal */}
      {showParticipantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowParticipantModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-2 text-center text-[#2E2E2E]">
              How many participants?
            </h2>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              Select the total number of people (including you as the Organizer)
            </p>
            <div className="grid grid-cols-5 gap-3 mb-6">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => handleParticipantSelect(n)}
                  className="aspect-square rounded-xl bg-brand text-white font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-md"
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowParticipantModal(false)}
              className="w-full rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Remove Item?"
        message={`Remove "${list.items.find((i) => i.id === itemToDelete)?.title}" from this list?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete)}
        onCancel={() => setItemToDelete(null)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete List?"
        message="Are you sure you want to delete this list? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDelete();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
      
      <ProcessSection />
      <div className="mx-auto max-w-3xl bg-white rounded-2xl p-8 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold">{list.title}</h1>
          <div className="flex items-center gap-2">
            {/* list view button */}
            <button
              type="button"
              title="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-md ${viewMode === "list" ? "bg-zinc-200 shadow" : "hover:bg-zinc-100"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.125 1.125 0 0 1 0 2.25H5.625a1.125 1.125 0 0 1 0-2.25Z" />
              </svg>
            </button>
            {/* grid view button */}
            <button
              type="button"
              title="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md ${viewMode === "grid" ? "bg-zinc-200 shadow" : "hover:bg-zinc-100"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <ul className="space-y-2">
            {list.items.map((item, idx) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2"
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
              >
                <div className="flex items-center gap-4">
                  <div className="cursor-grab text-zinc-400" title="Drag to reorder" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                      <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                    </svg>
                  </div>
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-16 h-16 rounded-md object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-400">📷</div>
                  )}
                  <div>
                    <div className="font-medium">{item.title}</div>
                    {item.notes && (
                      <div className="text-sm text-zinc-500">{item.notes}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(item.id);
                  }}
                  className="text-zinc-400 hover:text-red-600 transition-colors"
                  title="Remove item"
                  aria-label={`Remove ${item.title}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {list.items.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3"
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full aspect-[2/3] rounded-md object-cover" />
                ) : (
                  <div className="w-full aspect-[2/3] rounded-md bg-zinc-100 flex items-center justify-center text-zinc-400 text-2xl">📷</div>
                )}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="cursor-grab text-zinc-400 mt-1" title="Drag to reorder" aria-hidden>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                        </svg>
                      </div>
                      <div className="font-medium text-sm line-clamp-2 flex-1">{item.title}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item.id);
                      }}
                      className="text-zinc-400 hover:text-red-600 transition-colors flex-shrink-0"
                      title="Remove item"
                      aria-label={`Remove ${item.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                  {item.notes && (
                    <div className="text-xs text-zinc-500 line-clamp-1 mt-1">{item.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions panel removed as requested */}

        <div className="mt-8 flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={() => handleNarrowClick("in-person")}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-colors"
            >
              Narrow in person
            </button>
            <button
              onClick={() => handleNarrowClick("virtual")}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-colors"
            >
              Narrow virtually
            </button>
            <button
              onClick={() => router.push(`/new?editId=${list.id}`)}
              className="rounded-full bg-white border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-zinc-50 transition-colors"
            >
              Edit list
            </button>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="inline-flex h-9 w-9 items-center justify-center text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 active:translate-y-px transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete list"
            aria-label="Delete list"
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
        </div>
      </div>
    </main>
  );
}