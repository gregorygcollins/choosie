"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getList, upsertList } from "@/lib/storage";
import type { ChoosieList } from "@/components/ListForm";
import ProcessSection from "@/components/ProcessSection";

export default function VirtualInvitesPage() {
  const router = useRouter();
  const { id } = useParams();
  const [list, setList] = useState<ChoosieList | null>(null);
  const [invitees, setInvitees] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Helper to get list type name
  const getListTypeName = () => {
    if (!list) return "list";
    if (list.moduleType === "books") return "booklist";
    if (list.moduleType === "food") return "food list";
    if (list.moduleType === "music") return "musiclist";
    if (list.moduleType === "anything") return "list";
    return "watchlist"; // default for movies
  };

  useEffect(() => {
    if (typeof id === "string") {
      const found = getList(id);
      setList(found || null);
      if (found?.event?.invitees?.length) setInvitees(found.event.invitees.join(", "));
      if (found?.event?.notes) setNotes(found.event.notes);
    }
  }, [id]);
  if (list === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-zinc-700">
          <p className="text-xl mb-4">List not found 😢</p>
          <button
            onClick={() => router.push("/lists")}
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors"
          >
            Return to My Lists
          </button>
        </div>
      </main>
    );
  }

  function validateEmails(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const emails = parts.filter((p) => /.+@.+\..+/.test(p));
    return { parts, emails };
  }

  async function saveAndSend() {
    if (!list) return;
    const { emails } = validateEmails(invitees);
    if (emails.length === 0) {
      alert("Add at least one valid email address (comma-separated).");
      return;
    }

    setSaving(true);
    try {
      const updated: ChoosieList = {
        ...list,
        event: {
          ...(list.event || {}),
          invitees: emails,
          notes: notes?.trim() || undefined,
          visibility: list.event?.visibility || "link",
        },
      };
      upsertList(updated);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  // For virtual narrowing, link directly to the narrowing flow
  const link = `${origin}${basePath}/narrow/${updated.id}`;
      const listTypeName = list.moduleType === "books" ? "booklist" : 
                           list.moduleType === "food" ? "food list" :
                           list.moduleType === "music" ? "musiclist" :
                           list.moduleType === "karaoke" ? "karaoke list" :
                           list.moduleType === "anything" ? "list" : "watchlist";
      const subject = `Join my ${listTypeName}: ${updated.title}`;
      const body = `I just made a ${listTypeName} in Choosie.\n\nHelp narrow it down here: ${link}\n\nWe'll vote it down to one perfect pick together.\n\n—`;

      const mailto = `mailto:${encodeURIComponent(emails.join(","))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    } finally {
      setSaving(false);
    }
  }

  if (!list) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-zinc-700">
          <p className="text-xl mb-4">List not found</p>
          <button
            onClick={() => router.push("/lists")}
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white hover:opacity-90 transition-colors"
          >
            Back to My Lists
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <ProcessSection />
      <div className="mx-auto max-w-2xl bg-white rounded-2xl p-6 shadow-soft">
        <h1 className="text-2xl font-semibold mb-1">Narrow “{list.title}” virtually</h1>
        <p className="text-sm text-zinc-600 mb-6">Enter emails to send an invite with a link to the narrowing page.</p>

        <div className="grid gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-600">Invitees (comma-separated)</label>
            <input
              value={invitees}
              onChange={(e) => setInvitees(e.target.value)}
              className="rounded-lg border px-3 py-2"
              placeholder="e.g., alex@example.com, bea@example.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-600">Message (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border px-3 py-2"
              placeholder="Add context or instructions for your group (optional)"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push(`/list/${list.id}`)}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Back to {getListTypeName()}
          </button>
          <button
            onClick={saveAndSend}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Preparing…" : "Send invites"}
          </button>
        </div>
      </div>
    </main>
  );
}
