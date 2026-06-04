"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getList, removeList, upsertList } from "../../../lib/storage";
import { ChoosieList } from "../../../components/ListForm";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { toast } from "../../../components/Toast";
import ProcessSection from "../../../components/ProcessSection";
import { getSession, isPremium } from "@/lib/auth";
import { useSession } from "next-auth/react";
import UpsellModal from "@/components/UpsellModal";
import { computeNarrowingPlan, getMinimumListSizeForNarrowers } from "@/lib/planner";

type ListLogRound = {
  round: number;
  from: number;
  to: number;
  participant?: string | null;
  role?: string | null;
  kept: Array<{ id: string; title: string }>;
  removed: Array<{ id: string; title: string }>;
};

type ListLogSession = {
  id: string;
  mode?: string | null;
  completedAt: string;
  winner: { id: string; title: string } | null;
  startingItemCount: number;
  path: number[];
  rounds: ListLogRound[];
};

function getListModule(list: ChoosieList) {
  return (list as any).moduleType
    || (String(list.id).startsWith("book-") ? "books"
        : String(list.id).startsWith("music-") ? "music"
        : String(list.id).startsWith("food-") ? "food"
        : String(list.id).startsWith("anything-") ? "anything"
        : "movies");
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
      fallback: "bg-gradient-to-br from-blue-50 via-sky-100 to-slate-300 text-blue-800",
    };
  }

  if (module === "food") {
    return {
      badge: "bg-emerald-100 text-emerald-800",
      fallback: "bg-gradient-to-br from-emerald-50 via-teal-100 to-zinc-500 text-emerald-800",
    };
  }

  if (module === "music") {
    return {
      badge: "bg-violet-100 text-violet-800",
      fallback: "bg-gradient-to-br from-violet-50 via-fuchsia-100 to-zinc-600 text-violet-800",
    };
  }

  if (module === "anything") {
    return {
      badge: "bg-rose-100 text-rose-800",
      fallback: "bg-gradient-to-br from-rose-50 via-pink-100 to-zinc-500 text-rose-800",
    };
  }

  return {
    badge: "bg-teal-100 text-teal-800",
    fallback: "bg-gradient-to-br from-teal-50 via-cyan-100 to-zinc-500 text-teal-800",
  };
}

function getModuleTheme(module: string) {
  if (module === "books") {
    return {
      pageBg: "bg-gradient-to-b from-blue-50/65 via-white to-white",
      shell: "bg-white/95 border border-blue-100/80 shadow-[0_12px_30px_-20px_rgba(37,99,235,0.45)]",
      heading: "text-blue-900",
      toggleActive: "bg-blue-600 text-white shadow",
      toggleInactive: "text-blue-700 hover:bg-blue-50",
      focusRing: "focus:ring-blue-300",
      gridFocus: "group-focus:ring-blue-400",
      primaryButton: "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700",
      iconButton: "text-blue-700 hover:text-blue-900 focus:ring-blue-300/40",
      iconSolid: "text-blue-700 hover:bg-blue-700 hover:text-white",
      iconSoft: "group-hover:bg-blue-50 group-hover:text-blue-700",
    };
  }

  if (module === "food") {
    return {
      pageBg: "bg-gradient-to-b from-emerald-50/70 via-white to-white",
      shell: "bg-white/95 border border-emerald-100/80 shadow-[0_12px_30px_-20px_rgba(5,150,105,0.45)]",
      heading: "text-emerald-900",
      toggleActive: "bg-emerald-600 text-white shadow",
      toggleInactive: "text-emerald-700 hover:bg-emerald-50",
      focusRing: "focus:ring-emerald-300",
      gridFocus: "group-focus:ring-emerald-400",
      primaryButton: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700",
      iconButton: "text-emerald-700 hover:text-emerald-900 focus:ring-emerald-300/40",
      iconSolid: "text-emerald-700 hover:bg-emerald-700 hover:text-white",
      iconSoft: "group-hover:bg-emerald-50 group-hover:text-emerald-700",
    };
  }

  if (module === "music") {
    return {
      pageBg: "bg-gradient-to-b from-violet-50/70 via-white to-white",
      shell: "bg-white/95 border border-violet-100/80 shadow-[0_12px_30px_-20px_rgba(124,58,237,0.45)]",
      heading: "text-violet-900",
      toggleActive: "bg-violet-600 text-white shadow",
      toggleInactive: "text-violet-700 hover:bg-violet-50",
      focusRing: "focus:ring-violet-300",
      gridFocus: "group-focus:ring-violet-400",
      primaryButton: "bg-violet-600 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700",
      iconButton: "text-violet-700 hover:text-violet-900 focus:ring-violet-300/40",
      iconSolid: "text-violet-700 hover:bg-violet-700 hover:text-white",
      iconSoft: "group-hover:bg-violet-50 group-hover:text-violet-700",
    };
  }

  if (module === "anything") {
    return {
      pageBg: "bg-gradient-to-b from-rose-50/70 via-white to-white",
      shell: "bg-white/95 border border-rose-100/80 shadow-[0_12px_30px_-20px_rgba(244,63,94,0.45)]",
      heading: "text-rose-900",
      toggleActive: "bg-rose-600 text-white shadow",
      toggleInactive: "text-rose-700 hover:bg-rose-50",
      focusRing: "focus:ring-rose-300",
      gridFocus: "group-focus:ring-rose-400",
      primaryButton: "bg-rose-600 text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700",
      iconButton: "text-rose-700 hover:text-rose-900 focus:ring-rose-300/40",
      iconSolid: "text-rose-700 hover:bg-rose-700 hover:text-white",
      iconSoft: "group-hover:bg-rose-50 group-hover:text-rose-700",
    };
  }

  return {
    pageBg: "bg-gradient-to-b from-teal-50/70 via-white to-white",
    shell: "bg-white/95 border border-teal-100/80 shadow-[0_12px_30px_-20px_rgba(13,148,136,0.45)]",
    heading: "text-teal-900",
    toggleActive: "bg-teal-600 text-white shadow",
    toggleInactive: "text-teal-700 hover:bg-teal-50",
    focusRing: "focus:ring-teal-300",
    gridFocus: "group-focus:ring-teal-400",
    primaryButton: "bg-teal-600 text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700",
    iconButton: "text-teal-700 hover:text-teal-900 focus:ring-teal-300/40",
    iconSolid: "text-teal-700 hover:bg-teal-700 hover:text-white",
    iconSoft: "group-hover:bg-teal-50 group-hover:text-teal-700",
  };
}

function usesIdentityTile(module: string) {
  return module === "food" || module === "anything";
}

function ModuleGlyph({ module }: { module: string }) {
  return (
    <svg
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      {module === "food" ? (
        <>
          <path d="M4 3v7" />
          <path d="M8 3v7" />
          <path d="M4 7h4" />
          <path d="M6 10v11" />
          <path d="M17 3c1.7 1.7 2.5 3.7 2.5 6 0 2.2-.8 4-2.5 5.5V21" />
        </>
      ) : module === "music" ? (
        <>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </>
      ) : module === "anything" ? (
        <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" />
      ) : module === "books" ? (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
        </>
      ) : (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 5v14" />
          <path d="M17 5v14" />
          <path d="M3 9h4" />
          <path d="M17 9h4" />
          <path d="M3 15h4" />
          <path d="M17 15h4" />
        </>
      )}
    </svg>
  );
}

function ModuleMark({
  module,
  size = "sm",
  subtle = false,
}: {
  module: string;
  size?: "xs" | "sm";
  subtle?: boolean;
}) {
  const style = getModuleStyle(module);

  return (
    <span
      className={[
        "inline-grid shrink-0 place-items-center rounded-full ring-1",
        size === "xs" ? "h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5" : "h-8 w-8 [&_svg]:h-4 [&_svg]:w-4",
        subtle
          ? "bg-white/85 text-zinc-900 ring-white/70 backdrop-blur"
          : `${style.fallback} bg-white/90`,
      ].join(" ")}
      aria-label={getModuleLabel(module)}
      title={getModuleLabel(module)}
    >
      <ModuleGlyph module={module} />
    </span>
  );
}

function EntryFallback({ module, label }: { module: string; label: string }) {
  const style = getModuleStyle(module);

  return (
    <div className={["flex h-full w-full flex-col items-center justify-center gap-4 text-center", style.fallback].join(" ")}>
      <ModuleGlyph module={module} />
      <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
    </div>
  );
}

function EntryIdentityTile({ module, title, notes }: { module: string; title: string; notes?: string | null }) {
  const style = getModuleStyle(module);

  return (
    <div className={["relative h-full w-full overflow-hidden", style.fallback].join(" ")}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/18" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center sm:gap-2 sm:p-5">
        <span className="line-clamp-4 text-sm font-semibold leading-tight text-current sm:text-2xl sm:leading-snug">
          {title}
        </span>
        {notes && (
          <span className="line-clamp-2 text-[10px] font-medium leading-snug text-current/70 sm:text-sm">
            {notes}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ViewListPage() {
  const router = useRouter();
  const { id } = useParams();
  const [list, setList] = useState<ChoosieList | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sugs, setSugs] = useState<any[]>([]);
  const [sugsLoading, setSugsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [narrowingMode, setNarrowingMode] = useState<"in-person" | "virtual" | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [lastFocusedEl, setLastFocusedEl] = useState<HTMLElement | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  // Modal for showing generated narrowing links
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<{ url: string; role: string }[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logSessions, setLogSessions] = useState<ListLogSession[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const { data: authSession } = useSession();
  const session = typeof window !== 'undefined' ? getSession() : { user: null };
  const [pro, setPro] = useState<boolean>(isPremium(session));

  // Elevate pro flag if next-auth session user has isPro or server reports upgrade
  useEffect(() => {
    // If next-auth session has user.isPro (augment later), trust it first
    if (authSession?.user && (authSession.user as any).isPro && !pro) {
      setPro(true);
      return;
    }
    let cancelled = false;
    // Fetch /api/me to get authoritative isPro (Stripe webhook may have updated DB)
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data?.isPro && !pro) setPro(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [authSession, pro]);

  // Helper to get list type name
  const getListTypeName = () => {
    if (!list) return "list";
    const moduleType = (list as any).moduleType
      || (String(list.id).startsWith("book-") ? "books"
          : String(list.id).startsWith("music-") ? "music"
          : String(list.id).startsWith("food-") ? "food"
          : String(list.id).startsWith("anything-") ? "anything"
          : "movies");
    if (moduleType === "books") return "booklist";
    if (moduleType === "food") return "food list";
    if (moduleType === "music") return "musiclist";
    if (moduleType === "anything") return "list";
    return "watchlist"; // default for movies
  };

  const handleNarrowClick = (mode: "in-person" | "virtual") => {
    // Gate virtual narrowing for Pro users
    if (mode === "virtual" && !pro) {
      setShowUpsell(true);
      return;
    }
    setNarrowingMode(mode);
    setShowParticipantModal(true);
  };

  const [participantError, setParticipantError] = useState<string | null>(null);
  const handleParticipantSelect = (count: number) => {
    if (!list) return;
    if (count > 5 || count < 1) return; // Defensive: ignore out of range
    const minSize = getMinimumListSizeForNarrowers(count);
    if ((list.items?.length || 0) < minSize) {
      setParticipantError(`You need at least ${minSize} items for ${count} narrower${count === 1 ? '' : 's'}.`);
      return;
    }
    setParticipantError(null);
    // Compute narrowing plan and initialize progress for both in-person and virtual narrowing
    // Pass count+1 to include organizer for correct plan
    const plan = computeNarrowingPlan(list.items.length, count + 1, { participants: count + 1 });
    const updated = {
      ...list,
      participants: count,
      narrowingPlan: plan,
      progress: {
        remainingIds: list.items.map((i: any) => i.id),
        currentNarrower: 1,
        round: 1,
        totalRounds: plan.length,
        history: [],
      },
    };
    upsertList(updated);
    setList(updated);
    setShowParticipantModal(false);
    const syncParticipantsAndReset = async (sessionId?: string) => {
      try {
        await fetch("/api/choosie/updateList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            listId: list.id,
            participants: count,
            narrowingPlan: updated.narrowingPlan,
            progress: updated.progress,
          }),
        });
        await fetch("/api/choosie/narrow/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ listId: list.id, sessionId, participants: count }),
        });
      } catch (err) {
        console.error("Failed to sync narrowing setup to server:", err);
      }
    };

    if (narrowingMode === "in-person") {
      (async () => {
        await syncParticipantsAndReset();
        router.push(`/narrow/${list.id}`);
      })();
    } else {
      (async () => {
        // Virtual: handle 1 narrower (Decider) vs multiple narrowers (role claim page)
        const sessionId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await syncParticipantsAndReset(sessionId);
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const sessionQuery = `session=${encodeURIComponent(sessionId)}`;
        const organizerLink = `${base}/list/${list.id}/virtual?pt=organizer&${sessionQuery}`;
        if (count === 1) {
          // Only Decider: direct link, no role claim needed
          const deciderLink = `${base}/list/${list.id}/virtual?pt=0&start=1&${sessionQuery}`;
          setGeneratedLinks([
            { url: deciderLink, role: "Decider Link" },
            { url: organizerLink, role: "Organizer Watch Link" },
          ]);
        } else {
          const groupLink = `${base}/list/${list.id}/virtual/roles?${sessionQuery}`;
          setGeneratedLinks([
            { url: groupLink, role: "Group Link" },
            { url: organizerLink, role: "Organizer Watch Link" },
          ]);
        }
        setShowLinksModal(true);
      })();
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

  function openItemEditor(item: any) {
    setItemToEdit(item);
    setEditTitle(item.title || "");
    setEditNotes(item.notes || "");
  }

  async function handleSaveItemEdit() {
    if (!list || !itemToEdit) return;
    const title = editTitle.trim();
    const notes = editNotes.trim();
    if (!title) {
      toast("Give this entry a title before saving.", "error");
      return;
    }

    const updatedItems = list.items.map((item) =>
      item.id === itemToEdit.id
        ? { ...item, title, notes: notes || undefined }
        : item
    );
    const updatedList = { ...list, items: updatedItems };
    const updatedItem = updatedItems.find((item) => item.id === itemToEdit.id);

    setEditSaving(true);
    upsertList(updatedList);
    setList(updatedList);
    if (previewItem?.id === itemToEdit.id && updatedItem) {
      setPreviewItem(updatedItem);
    }

    try {
      const res = await fetch("/api/choosie/updateList", {
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
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.list) {
        upsertList(data.list);
        setList(data.list);
        const syncedItem = data.list.items?.find((item: any) => item.id === itemToEdit.id);
        if (previewItem?.id === itemToEdit.id && syncedItem) {
          setPreviewItem(syncedItem);
        }
        toast("Entry updated", "success");
      } else {
        toast("Entry saved on this device. Sign in to sync it.", "success");
      }
    } catch (err) {
      console.error("Failed to sync item edit to server:", err);
      toast("Entry saved on this device. Sign in to sync it.", "success");
    } finally {
      setEditSaving(false);
      setItemToEdit(null);
    }
  }

  // Open preview helper
  function openPreview(item: any) {
    setLastFocusedEl(document.activeElement as HTMLElement);
    setPreviewItem(item);
  }

  function closePreview() {
    setPreviewItem(null);
    // restore focus for accessibility
    if (lastFocusedEl) {
      setTimeout(() => {
        try { lastFocusedEl.focus(); } catch {}
      }, 0);
    }
  }

  // Escape key to close preview
  useEffect(() => {
    if (!previewItem) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePreview();
      }
      // basic focus trap: cycle Tab within modal
      if (e.key === "Tab") {
        const modal = document.getElementById("item-preview-modal");
        if (!modal) return;
        const focusables = Array.from(modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.hasAttribute('data-focus-guard'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [previewItem]);

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

  async function handleShareList() {
    if (!list) return;
    setShareLoading(true);

    try {
      const res = await fetch("/api/choosie/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listId: list.id, action: "enable" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.share?.url) {
        throw new Error(data?.error || "Unable to create share link");
      }

      setShareUrl(data.share.url);
      setShowShareModal(true);
      try {
        await navigator.clipboard.writeText(data.share.url);
        toast("Share link copied", "success");
      } catch {
        toast("Share link ready", "success");
      }
    } catch (error: any) {
      const message =
        error?.message === "Authentication required"
          ? "Sign in to share this list."
          : error?.message || "Could not create a share link.";
      toast(message, "error");
    } finally {
      setShareLoading(false);
    }
  }

  async function handleOpenListLog() {
    if (!list) return;
    if (!pro) {
      setShowUpsell(true);
      return;
    }

    setShowLogModal(true);
    setLogLoading(true);
    setLogError(null);
    try {
      const res = await fetch("/api/choosie/listLog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listId: list.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to load list log");
      }
      setLogSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (error: any) {
      const message = error?.message || "Unable to load list log";
      setLogError(
        message === "List not found"
          ? "No List Log yet. Finish a narrowing session with this saved list and its winners will show up here."
          : message
      );
    } finally {
      setLogLoading(false);
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
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark transition-colors"
          >
            Create a new one
          </button>
        </div>
      </main>
    );
  }

  const listModule = getListModule(list);
  const moduleLabel = getModuleLabel(listModule);
  const moduleTheme = getModuleTheme(listModule);

  return (
    <main className={["min-h-screen p-3 sm:p-8", moduleTheme.pageBg].join(" ")}>
            {/* Participant Count Modal */}
      {showParticipantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowParticipantModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-2 text-center text-[#2E2E2E]">
              How many narrowers?
            </h2>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              Select the total number of people narrowing after you, the Organizer.
            </p>
            {participantError && <div className="text-red-600 text-sm mb-4 text-center">{participantError}</div>}
            <div className="mx-auto mb-6 grid max-w-[22rem] grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => handleParticipantSelect(n)}
                  className="grid h-14 w-14 place-items-center rounded-xl bg-consensus text-base font-semibold text-brand-dark shadow-md shadow-consensus/20 transition-all hover:scale-105 hover:bg-consensus-dark"
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowParticipantModal(false)}
              className="w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Show group narrowing link for all participants */}
      {showLinksModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowLinksModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-2 text-center text-[#2E2E2E]">Share this link with your group!</h2>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              When they join, each person will claim a role and take a turn narrowing the list—until one final choice remains.
            </p>
            <div className="mb-4 flex flex-col items-center gap-3">
              {generatedLinks.map((link) => (
                <div key={link.role} className="text-xs break-all border rounded px-3 py-2 flex flex-col gap-1 w-full">
                  <span className="font-semibold mb-1">{link.role}</span>
                  <div className="flex items-center gap-2">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex-1">{link.url}</a>
                    <button
                      type="button"
                      title="Copy link"
                      aria-label={`Copy ${link.role}`}
                      onClick={() => {
                        navigator.clipboard.writeText(link.url);
                      }}
                      className="ml-1 p-1 rounded hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="3" y="3" width="13" height="13" rx="2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setShowLinksModal(false)} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark w-full">Done</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-2 text-center text-brand">Share this list</h2>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              Anyone with this link can view a read-only copy of your list.
            </p>
            <div className="rounded-xl border border-zinc-200 bg-brand-light p-3">
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-brand underline">
                {shareUrl}
              </a>
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                title="Copy link"
                aria-label="Copy link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast("Share link copied", "success");
                  } catch {
                    toast("Copy failed", "error");
                  }
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <rect x="3" y="3" width="13" height="13" rx="2" />
                </svg>
              </button>
              <button
                type="button"
                title="Close"
                aria-label="Close share dialog"
                onClick={() => setShowShareModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-brand transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setShowLogModal(false)}>
          <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">List Log</p>
                <h2 className="mt-1 text-2xl font-semibold text-brand">{list.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-brand"
                title="Close list log"
                aria-label="Close list log"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {logLoading ? (
              <div className="mt-6 rounded-xl border border-zinc-200 bg-brand-light/50 p-5 text-sm font-semibold text-brand">
                Loading list log...
              </div>
            ) : logError ? (
              <div className="mt-6 rounded-xl border border-consensus/30 bg-consensus/10 p-5 text-sm leading-6">
                <div className="text-base font-bold text-brand">
                  {logError.startsWith("No List Log yet") ? "Nothing in the log yet" : "List Log is taking a minute"}
                </div>
                <p className="mt-1 text-slate-600">{logError}</p>
              </div>
            ) : logSessions.length === 0 ? (
              <div className="mt-6 rounded-xl border border-zinc-200 bg-brand-light/50 p-5 text-sm leading-6 text-slate-600">
                Completed narrowing sessions will appear here after this list reaches a winner.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {logSessions.map((session) => (
                  <article key={session.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-bold text-brand">
                          {session.winner ? session.winner.title : "No winner recorded"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(session.completedAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {session.mode ? ` · ${session.mode === "virtual" ? "Virtual" : "In person"}` : ""}
                        </div>
                      </div>
                      <div className="rounded-full bg-consensus/15 px-3 py-1 text-xs font-bold text-brand">
                        {session.path.join(" -> ")}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {session.rounds.map((round) => (
                        <details key={`${session.id}-${round.round}`} className="rounded-xl border border-zinc-100 bg-brand-light/40 p-3">
                          <summary className="cursor-pointer text-sm font-semibold text-brand">
                            Round {round.round}: {round.from} to {round.to}
                            {round.participant ? (
                              <span className="ml-2 font-medium text-slate-500">
                                by {round.participant}{round.role ? ` (${round.role})` : ""}
                              </span>
                            ) : round.role ? (
                              <span className="ml-2 font-medium text-slate-500">
                                by {round.role}
                              </span>
                            ) : null}
                          </summary>
                          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Kept</div>
                              <ul className="mt-2 space-y-1 text-slate-700">
                                {round.kept.map((item) => (
                                  <li key={item.id}>{item.title}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Removed</div>
                              <ul className="mt-2 space-y-1 text-slate-500">
                                {round.removed.length > 0 ? (
                                  round.removed.map((item) => <li key={item.id}>{item.title}</li>)
                                ) : (
                                  <li>None</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
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

      {itemToEdit && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !editSaving && setItemToEdit(null)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="item-edit-title"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Edit entry</p>
                <h2 id="item-edit-title" className="mt-1 text-2xl font-semibold text-brand">
                  Update title or note
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setItemToEdit(null)}
                disabled={editSaving}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-brand disabled:opacity-50"
                title="Close editor"
                aria-label="Close editor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="edit-item-title" className="block text-sm font-semibold text-brand">
                  Title
                </label>
                <input
                  id="edit-item-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
                  placeholder="Entry title"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="edit-item-notes" className="block text-sm font-semibold text-brand">
                  Note
                </label>
                <textarea
                  id="edit-item-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="mt-2 min-h-28 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-consensus/40"
                  placeholder="Add a note, reason, correction, or context."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setItemToEdit(null)}
                disabled={editSaving}
                className="rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-brand hover:bg-zinc-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItemEdit}
                disabled={editSaving}
                className="rounded-full bg-consensus px-5 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-consensus-dark disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save entry"}
              </button>
            </div>
          </div>
        </div>
      )}

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
      <div className={["mx-auto rounded-2xl p-3 backdrop-blur sm:p-8", moduleTheme.shell, viewMode === "grid" ? "max-w-7xl" : "max-w-4xl"].join(" ")}>
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:items-center">
          <div className="min-w-0">
            <h1 className={["truncate text-2xl font-semibold sm:text-3xl", moduleTheme.heading].join(" ")}>{list.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500 sm:mt-2">
              <ModuleMark module={listModule} size="xs" />
              <span>{list.items.length} items</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* list view button */}
            <button
              type="button"
              title="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`grid h-9 w-9 place-items-center rounded-full transition sm:h-10 sm:w-10 ${viewMode === "list" ? moduleTheme.toggleActive : moduleTheme.toggleInactive}`}
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
              className={`grid h-9 w-9 place-items-center rounded-full transition sm:h-10 sm:w-10 ${viewMode === "grid" ? moduleTheme.toggleActive : moduleTheme.toggleInactive}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <ul className="space-y-3 sm:space-y-4">
            {list.items.map((item, idx) => (
              <li
                key={item.id}
                className={["group flex cursor-pointer gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 sm:flex-row sm:gap-0 sm:p-0", moduleTheme.focusRing].join(" ")}
                role="button"
                tabIndex={0}
                aria-label={`Preview ${item.title}`}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
                onClick={() => {
                  if (dragIndex != null) return;
                  openPreview(item);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPreview(item);
                  }
                }}
              >
                <div className="relative h-28 w-[4.65rem] shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:h-auto sm:w-36 sm:rounded-none">
                  {usesIdentityTile(listModule) ? (
                    <EntryIdentityTile module={listModule} title={item.title} />
                  ) : item.image ? (
                    <img src={item.image} alt="" aria-hidden="true" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <EntryFallback module={listModule} label={moduleLabel} />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-1 pr-1 sm:gap-4 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ModuleMark module={listModule} size="xs" />
                      <h2 className={["line-clamp-2 text-base font-semibold leading-tight sm:text-lg sm:leading-snug", moduleTheme.heading].join(" ")}>{item.title}</h2>
                    </div>
                    {item.notes ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500 sm:mt-2 sm:leading-6">{item.notes}</p>
                    ) : (
                      <p className="mt-1 text-sm leading-5 text-zinc-400 sm:mt-2 sm:leading-6">No note yet.</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <div className={["cursor-grab rounded-full bg-zinc-100 p-1.5 text-zinc-400 transition sm:p-2", moduleTheme.iconSoft].join(" ")} title="Drag to reorder" aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="sm:h-[18px] sm:w-[18px]">
                        <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                        <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                        <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                      </svg>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(item);
                      }}
                      className={["grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-sm font-bold transition sm:h-9 sm:w-9", moduleTheme.iconSolid].join(" ")}
                      title="Item info"
                      aria-label={`Show info for ${item.title}`}
                    >
                      i
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openItemEditor(item);
                      }}
                      className={["grid h-8 w-8 place-items-center rounded-full bg-zinc-100 transition sm:h-9 sm:w-9", moduleTheme.iconSolid].join(" ")}
                      title="Edit item"
                      aria-label={`Edit ${item.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item.id);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white sm:h-9 sm:w-9"
                      title="Remove item"
                      aria-label={`Remove ${item.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 min-[390px]:grid-cols-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {list.items.map((item, idx) => (
              <div
                key={item.id}
                className="group cursor-pointer focus:outline-none"
                role="button"
                tabIndex={0}
                aria-label={`Preview ${item.title}`}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
                onClick={() => {
                  if (dragIndex != null) return;
                  openPreview(item);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPreview(item);
                  }
                }}
              >
                <div className={["relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-950 shadow-lg ring-1 ring-white/10 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-2xl group-focus:ring-2", moduleTheme.gridFocus].join(" ")}>
                  {usesIdentityTile(listModule) ? (
                    <EntryIdentityTile module={listModule} title={item.title} notes={item.notes} />
                  ) : item.image ? (
                    <img src={item.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <EntryFallback module={listModule} label={moduleLabel} />
                  )}

                  <div className={usesIdentityTile(listModule) ? "hidden" : "absolute inset-0 hidden bg-gradient-to-t from-black/90 via-black/20 to-black/5 opacity-90 transition group-hover:opacity-100 sm:block"} />
                  <div className={usesIdentityTile(listModule) ? "hidden" : "absolute left-0 right-0 bottom-0 z-10 hidden flex-col gap-2 p-4 pr-12 sm:flex"}>
                    <div>
                      <h2 className="line-clamp-2 text-base font-semibold leading-tight text-white drop-shadow">
                        {item.title}
                      </h2>
                      {item.notes && (
                        <p className="mt-1 truncate text-xs text-white/75">{item.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="absolute right-3 top-3 z-20 hidden rounded-full bg-white/90 p-1 text-zinc-500 shadow-lg opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 sm:flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openItemEditor(item);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-brand-light hover:text-brand"
                      title="Edit item"
                      aria-label={`Edit ${item.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item.id);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-red-50 hover:text-red-600"
                      title="Remove item"
                      aria-label={`Remove ${item.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(item);
                    }}
                    className={["absolute right-3 bottom-3 z-20 hidden h-8 w-8 place-items-center rounded-full bg-white/90 text-sm font-bold text-zinc-900 shadow-lg transition focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/80 sm:grid sm:opacity-0 sm:group-hover:opacity-100", moduleTheme.iconSolid].join(" ")}
                    title="Item info"
                    aria-label={`Show info for ${item.title}`}
                  >
                    i
                  </button>
                </div>
                <h2 className={usesIdentityTile(listModule) ? "hidden" : ["mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight sm:hidden", moduleTheme.heading].join(" ")}>
                  {item.title}
                </h2>
                {!usesIdentityTile(listModule) && item.notes && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] leading-none text-zinc-500 sm:hidden">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Suggestions panel removed as requested */}

        <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => handleNarrowClick("in-person")}
              className={["min-w-0 flex-1 rounded-full px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-4", moduleTheme.primaryButton].join(" ")}
            >
              Narrow in person
            </button>
            <button
              onClick={() => handleNarrowClick("virtual")}
              className={["min-w-0 flex-1 rounded-full px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-4", moduleTheme.primaryButton].join(" ")}
            >
              Narrow virtually
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleOpenListLog}
              className={["inline-flex h-9 w-9 items-center justify-center focus:outline-none focus:ring-2 active:translate-y-px transition-colors", moduleTheme.iconButton].join(" ")}
              title="List log"
              aria-label="List log"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 8v5l3 2" />
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button
              onClick={() => router.push(`/new?editId=${list.id}`)}
              className={["inline-flex h-9 w-9 items-center justify-center focus:outline-none focus:ring-2 active:translate-y-px transition-colors", moduleTheme.iconButton].join(" ")}
              title="Edit list"
              aria-label="Edit list"
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
            <button
              onClick={handleShareList}
              disabled={shareLoading}
              className={["inline-flex h-9 w-9 items-center justify-center focus:outline-none focus:ring-2 active:translate-y-px transition-colors disabled:cursor-not-allowed disabled:opacity-60", moduleTheme.iconButton].join(" ")}
              title={shareLoading ? "Sharing..." : "Share list"}
              aria-label={shareLoading ? "Sharing list" : "Share list"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.59 13.51 6.83 3.98" />
                <path d="m15.41 6.51-6.82 3.98" />
              </svg>
            </button>
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
      </div>

      {/* Item Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn"
          onClick={closePreview}
          aria-modal="true"
          role="dialog"
          aria-labelledby="item-preview-title"
        >
          <div
            id="item-preview-modal"
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start p-5 pb-3">
              <h2 id="item-preview-title" className="text-xl font-semibold pr-6">
                {previewItem.title}
              </h2>
              <button
                onClick={closePreview}
                className="text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/40 rounded-md p-1"
                aria-label="Close preview"
                autoFocus
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
            {previewItem.image && (
              <div className="px-5">
                <img src={previewItem.image} alt={previewItem.title} className="w-full max-h-80 object-cover rounded-lg" />
              </div>
            )}
            <div className="p-5 pt-4 space-y-4">
              {previewItem.notes ? (
                <p className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
                  {previewItem.notes}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic">No notes provided.</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    openItemEditor(previewItem);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-brand hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  title="Edit item"
                  aria-label={`Edit ${previewItem.title}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showUpsell && (
        <UpsellModal open={showUpsell} onClose={() => setShowUpsell(false)} />
      )}
    </main>
  );
}
