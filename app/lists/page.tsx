"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadLists, removeList } from "@/lib/storage";
import type { ChoosieList } from "@/components/ListForm";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "@/components/Toast";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<ChoosieList[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedLocalFallback, setUsedLocalFallback] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChoosieList | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Try server-backed lists first (requires sign-in)
        const res = await fetch("/api/choosie/getMyLists", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.ok && Array.isArray(data.lists)) {
            setLists(data.lists);
            setLoading(false);
            return;
          }
        }
      } catch {}
      // Fallback: local lists
      if (!cancelled) {
        setUsedLocalFallback(true);
        setLists(loadLists());
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(list: ChoosieList) {
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
          setLists((prev) => prev.filter((l) => l.id !== list.id));
          toast("List deleted successfully", "success");
          setDeleteTarget(null);
          setIsDeleting(false);
          return;
        }
      }
    } catch (error) {
      console.error("Server delete failed:", error);
    }
    
    // Fallback: delete from local storage
    try {
      removeList(list.id);
      setLists((prev) => prev.filter((l) => l.id !== list.id));
      toast("List deleted", "success");
    } catch (error) {
      console.error("Delete failed:", error);
      toast("Failed to delete list", "error");
    }
    
    setDeleteTarget(null);
    setIsDeleting(false);
  }

  if (lists.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8 dark:bg-black">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-black dark:text-white">
            No lists yet
          </h1>
          <p className="mb-8 text-zinc-600 dark:text-zinc-400">
            You haven't created any lists yet — start one!
          </p>
          <Link
            href="/new"
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-white transition-all hover:opacity-90 active:translate-y-px"
          >
            Create your first list
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen px-8 py-12 sm:px-16">
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete List?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
      
      <div className="mx-auto max-w-3xl">
        {usedLocalFallback && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
            Showing lists saved on this device. Sign in to sync across devices, or check site origin settings if your server lists aren’t loading.
          </div>
        )}
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            My Lists
          </h1>
          <Link
            href="/new"
            className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm text-white transition-all hover:opacity-90 active:translate-y-px"
          >
            Create new list
          </Link>
        </div>

        <div className="grid gap-4">
          {lists.map((list) => {
            // Derive module if missing from server/local legacy data
            const derivedModule = (list as any).moduleType
              || (list.id?.startsWith("book-") ? "books"
                  : list.id?.startsWith("music-") ? "music"
                  : list.id?.startsWith("food-") ? "food"
                  : list.id?.startsWith("anything-") ? "anything"
                  : "movies");
            const listTypeName = derivedModule === "books" ? "booklist" :
                                 derivedModule === "food" ? "foodlist" :
                                 derivedModule === "music" ? "musiclist" :
                                   derivedModule === "anything" ? "anythinglist" : "watchlist";
            
            return (
            <div
              key={list.id}
              className="card flex flex-col gap-4 rounded-2xl p-6 transition-transform hover:translate-y-[-2px] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-medium text-black dark:text-white">
                  {list.title}
                </h2>
                <div className="mt-1 flex gap-4 text-sm text-zinc-500">
                  <span>{list.items.length} items</span>
                  <span>Created {formatDate(list.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/list/${list.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-brand px-4 text-sm text-white transition-all hover:opacity-90 active:translate-y-px"
                >
                  View {listTypeName}
                </Link>
                {list.narrowers && (
                  <Link
                    href={`/narrow/${list.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 px-4 text-sm transition-all hover:bg-black/[.03] active:translate-y-px dark:border-white/20 dark:hover:bg-white/[.06]"
                  >
                    Continue narrowing
                  </Link>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteTarget(list);
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-red-600 px-4 text-sm text-red-600 transition-all hover:bg-red-50 active:translate-y-px"
                  title="Delete list"
                >
                  Delete
                </button>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}