"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ChoosieList } from "../../components/ListForm";
import { toast } from "../../components/Toast";
import { loadLists, removeList, upsertList } from "../../lib/storage";

type ViewMode = "list" | "grid";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function ModuleIcon({ module }: { module: string }) {
  const commonProps = {
    className: "h-8 w-8",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
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

function GridIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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

function getModuleStyle(module: string) {
  if (module === "books") {
    return {
      badge: "bg-blue-100 text-blue-800",
      thumbnail: "bg-blue-50 text-blue-700 ring-blue-200",
    };
  }

  if (module === "food") {
    return {
      badge: "bg-emerald-100 text-emerald-800",
      thumbnail: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (module === "music") {
    return {
      badge: "bg-violet-100 text-violet-800",
      thumbnail: "bg-violet-50 text-violet-700 ring-violet-200",
    };
  }

  if (module === "anything") {
    return {
      badge: "bg-rose-100 text-rose-800",
      thumbnail: "bg-rose-50 text-rose-700 ring-rose-200",
    };
  }

  return {
    badge: "bg-teal-100 text-teal-800",
    thumbnail: "bg-teal-50 text-teal-700 ring-teal-200",
  };
}

function mergeLists(serverLists: ChoosieList[], localLists: ChoosieList[]) {
  const seen = new Set(serverLists.map((list) => list.id));
  return [...serverLists, ...localLists.filter((list) => !seen.has(list.id))];
}

function ListThumbnail({
  list,
  module,
  moduleLabel,
  variant,
}: {
  list: ChoosieList;
  module: string;
  moduleLabel: string;
  variant: ViewMode;
}) {
  const image = list.items?.[0]?.image;
  const firstTitle = list.items?.[0]?.title;
  const moduleStyle = getModuleStyle(module);

  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1",
        variant === "grid" ? "h-20 w-20" : "h-20 w-20",
        moduleStyle.thumbnail,
      ].join(" ")}
      title={firstTitle || `${moduleLabel} list`}
      aria-label={firstTitle ? `First item: ${firstTitle}` : `${moduleLabel} list`}
    >
      {image ? (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
      ) : (
        <span>
          <ModuleIcon module={module} />
        </span>
      )}
    </span>
  );
}

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<ChoosieList[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedLocalFallback, setUsedLocalFallback] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChoosieList | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [descriptionTarget, setDescriptionTarget] = useState<ChoosieList | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [descriptionSaving, setDescriptionSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Try server-backed lists first (requires sign-in)
        const res = await fetch("/api/choosie/getMyLists", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.ok && Array.isArray(data.lists)) {
            setLists(mergeLists(data.lists, loadLists()));
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
          removeList(list.id);
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

  function openDescriptionEditor(list: ChoosieList) {
    setDescriptionTarget(list);
    setDescriptionDraft(list.description || "");
  }

  async function saveDescription() {
    if (!descriptionTarget) return;
    const description = descriptionDraft.trim();
    const nextList = { ...descriptionTarget, description: description || undefined };
    setDescriptionSaving(true);
    upsertList(nextList);
    setLists((prev) => prev.map((list) => (list.id === nextList.id ? nextList : list)));

    try {
      const res = await fetch("/api/choosie/updateList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listId: nextList.id, description }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.list) {
        upsertList(data.list);
        setLists((prev) => prev.map((list) => (list.id === data.list.id ? { ...list, ...data.list } : list)));
        toast("Description updated", "success");
      } else {
        toast("Description saved on this device", "success");
      }
    } catch {
      toast("Description saved on this device", "success");
    } finally {
      setDescriptionSaving(false);
      setDescriptionTarget(null);
    }
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
            className="inline-flex h-12 items-center justify-center rounded-full bg-consensus px-6 text-base font-semibold text-brand-dark shadow-lg shadow-consensus/25 transition hover:bg-consensus-dark"
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
      {descriptionTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDescriptionTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="description-editor-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Description</p>
                <h2 id="description-editor-title" className="mt-1 text-xl font-semibold text-brand">
                  {descriptionTarget.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDescriptionTarget(null)}
                className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                title="Close"
                aria-label="Close description editor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              className="mt-5 min-h-32 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="What is this list for?"
            />
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={saveDescription}
                disabled={descriptionSaving}
                className="rounded-full bg-consensus px-5 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-consensus-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {descriptionSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={["mx-auto", viewMode === "grid" ? "max-w-7xl" : "max-w-6xl"].join(" ")}>
        {usedLocalFallback && (
          <div className="mb-4 rounded-lg border border-[#DDE6F3] bg-[#F8F9FF] text-brand-dark px-4 py-3 text-sm">
            Showing lists saved on this device. Sign in to sync across devices, or check site origin settings if your server lists aren't loading.
          </div>
        )}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-brand">
            My Lists
          </h1>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 rounded-full border border-brand/10 bg-white p-1 shadow-soft" aria-label="Choose view">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={[
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
                  viewMode === "list" ? "bg-brand text-white" : "text-brand hover:bg-brand-light",
                ].join(" ")}
                title="List view"
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <ListIcon />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={[
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
                  viewMode === "grid" ? "bg-brand text-white" : "text-brand hover:bg-brand-light",
                ].join(" ")}
                title="Grid view"
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <GridIcon />
              </button>
            </div>
            <Link
              href="/new"
              className="inline-grid h-11 w-11 place-items-center rounded-full bg-consensus text-brand-dark transition-colors hover:bg-consensus-dark focus:outline-none focus:ring-2 focus:ring-consensus/50 glow-consensus"
              title="Create new list"
              aria-label="Create new list"
            >
              <PlusIcon />
            </Link>
          </div>
        </div>

        <div className={viewMode === "grid" ? "grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid gap-5"}>
          {lists.map((list) => {
            // Derive module if missing from server/local legacy data
            const derivedModule = (list as any).moduleType
              || (list.id?.startsWith("book-") ? "books"
                  : list.id?.startsWith("music-") ? "music"
                  : list.id?.startsWith("food-") ? "food"
                  : list.id?.startsWith("anything-") ? "anything"
                  : "movies");
            const moduleLabel = getModuleLabel(derivedModule);
            const moduleStyle = getModuleStyle(derivedModule);
            const coverImage = list.items?.[0]?.image;
            const firstItemTitle = list.items?.[0]?.title;

            if (viewMode === "grid") {
              return (
                <div
                  key={list.id}
                  onClick={() => router.push(`/list/${list.id}`)}
                  className="group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-lg bg-zinc-950 shadow-lg ring-1 ring-white/10 transition duration-200 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/list/${list.id}`);
                    }
                  }}
                >
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={[
                        "absolute inset-0 flex flex-col items-center justify-center gap-4 p-5 text-center",
                        moduleStyle.thumbnail,
                      ].join(" ")}
                    >
                      <ModuleIcon module={derivedModule} />
                      <span className="text-sm font-semibold uppercase tracking-[0.14em]">
                        {moduleLabel}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5 opacity-90 transition group-hover:opacity-100" />
                  <div className="absolute left-0 right-0 bottom-0 z-10 flex flex-col gap-2 p-4 pr-12">
                    <span className={["w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold", coverImage ? "bg-white/85 text-zinc-900" : moduleStyle.badge].join(" ")}>
                      {moduleLabel}
                    </span>
                    <div>
                      <h2 className="line-clamp-2 text-base font-semibold leading-tight text-white drop-shadow">
                        {list.title}
                      </h2>
                      <p className="mt-1 truncate text-xs text-white/75">
                        {list.items.length} items{firstItemTitle ? ` · ${firstItemTitle}` : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDescriptionEditor(list);
                    }}
                    className="absolute right-3 bottom-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm font-bold text-zinc-900 shadow-lg transition hover:bg-teal-500 hover:text-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/80 sm:opacity-0 sm:group-hover:opacity-100"
                    title="List info"
                    aria-label={`List info for ${list.title}`}
                  >
                    i
                  </button>
                </div>
              );
            }
            
            return (
            <div
              key={list.id}
              onClick={() => router.push(`/list/${list.id}`)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-brand/10 bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-consensus/40 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand/40 sm:flex-row"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/list/${list.id}`);
                }
              }}
            >
              <div className="relative h-40 shrink-0 overflow-hidden bg-zinc-100 sm:h-auto sm:w-44">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={[
                      "flex h-full w-full flex-col items-center justify-center gap-4 text-center",
                      moduleStyle.thumbnail,
                    ].join(" ")}
                  >
                    <ModuleIcon module={derivedModule} />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">{moduleLabel}</span>
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                  {list.items.length} items
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="line-clamp-2 text-xl font-semibold leading-snug text-brand">
                      {list.title}
                    </h2>
                    <span className={["rounded-full px-2.5 py-1 text-xs font-semibold", moduleStyle.badge].join(" ")}>
                      {moduleLabel}
                    </span>
                  </div>
                  {list.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{list.description}</p>
                  ) : firstItemTitle ? (
                    <p className="mt-2 line-clamp-1 text-sm leading-6 text-zinc-500">Starts with {firstItemTitle}</p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-zinc-400">No description yet.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
                    <span>{list.items.length} items</span>
                    <span>Created {formatDate(list.createdAt)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {list.narrowers && (
                    <Link
                      href={`/narrow/${list.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-brand-light px-4 text-sm font-semibold text-brand transition hover:bg-consensus/30 active:translate-y-px"
                    >
                      Continue narrowing
                    </Link>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDescriptionEditor(list);
                    }}
                    className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-brand transition hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand/30 active:translate-y-px"
                    title="Edit description"
                    aria-label={`Edit description for ${list.title}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="17"
                      height="17"
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(list);
                    }}
                    className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300 active:translate-y-px"
                    title="Delete list"
                    aria-label={`Delete ${list.title}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="17"
                      height="17"
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
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}
