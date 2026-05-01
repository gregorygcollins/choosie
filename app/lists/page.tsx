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

function ModuleIcon({ module }: { module: string }) {
  const commonProps = {
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (module === "books") {
    return (
      <svg {...commonProps}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      </svg>
    );
  }

  if (module === "food") {
    return (
      <svg {...commonProps}>
        <path d="M4 3v7" />
        <path d="M8 3v7" />
        <path d="M4 7h4" />
        <path d="M6 10v11" />
        <path d="M17 3c1.7 1.7 2.5 3.7 2.5 6 0 2.2-.8 4-2.5 5.5V21" />
      </svg>
    );
  }

  if (module === "music") {
    return (
      <svg {...commonProps}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    );
  }

  if (module === "anything") {
    return (
      <svg {...commonProps}>
        <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 5v14" />
      <path d="M17 5v14" />
      <path d="M3 9h4" />
      <path d="M17 9h4" />
      <path d="M3 15h4" />
      <path d="M17 15h4" />
    </svg>
  );
}

function getModuleLabel(module: string) {
  if (module === "books") return "Books";
  if (module === "food") return "Food";
  if (module === "music") return "Music";
  if (module === "anything") return "Anything";
  return "Movies";
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
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-brand">
            No lists yet
          </h1>
          <p className="mb-8 text-zinc-600 dark:text-zinc-400">
            You haven't created any lists yet — start one!
          </p>
          <Link
            href="/new"
            className="btn-charcoal rounded-full inline-flex h-12 items-center justify-center px-6 text-base"
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
          <div className="mb-4 rounded-lg border border-[#DDE6F3] bg-[#F8F9FF] text-brand-dark px-4 py-3 text-sm">
            Showing lists saved on this device. Sign in to sync across devices, or check site origin settings if your server lists aren't loading.
          </div>
        )}
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-brand">
            My Lists
          </h1>
          <Link
            href="/new"
            className="btn-charcoal rounded-full inline-flex h-12 items-center justify-center px-6 text-base"
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
            const moduleLabel = getModuleLabel(derivedModule);
            
            return (
            <div
              key={list.id}
              onClick={() => router.push(`/list/${list.id}`)}
              className="card flex flex-col gap-4 rounded-2xl p-6 transition-transform hover:translate-y-[-2px] sm:flex-row sm:items-center sm:justify-between cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/list/${list.id}`);
                }
              }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand ring-1 ring-brand/10"
                    title={`${moduleLabel} list`}
                    aria-label={`${moduleLabel} list`}
                  >
                    <ModuleIcon module={derivedModule} />
                  </span>
                  <div>
                    <h2 className="font-medium text-brand">
                      {list.title}
                    </h2>
                    <span className="mt-1 inline-flex rounded-full bg-consensus/10 px-2 py-0.5 text-xs font-semibold text-brand">
                      {moduleLabel}
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex gap-4 text-sm text-zinc-500">
                  <span>{list.items.length} items</span>
                  <span>Created {formatDate(list.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                {list.narrowers && (
                  <Link
                    href={`/narrow/${list.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 px-4 text-sm transition-all hover:bg-black/[.03] active:translate-y-px dark:border-white/20 dark:hover:bg-white/[.06]"
                  >
                    Continue narrowing
                  </Link>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget(list);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 active:translate-y-px transition-colors"
                  title="Delete list"
                  aria-label={`Delete ${list.title}`}
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
          );
          })}
        </div>
      </div>
    </div>
  );
}
