"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getList, upsertList } from "@/lib/storage";
import { computeNarrowingPlan, getRoleName } from "@/lib/planner";
import { getSession, isPremium } from "@/lib/auth";
import { useSession } from "next-auth/react";
import UpsellModal from "@/components/UpsellModal";
import type { ChoosieList } from "@/components/ListForm";
import ProcessSection from "@/components/ProcessSection";

export default function VirtualInvitesPage() {
  const router = useRouter();
  const { id } = useParams();
  const [list, setList] = useState<ChoosieList | null>(null);
  const [invitees, setInvitees] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const { data: authSession } = useSession();
  const session = typeof window !== 'undefined' ? getSession() : { user: null };
  const [pro, setPro] = useState<boolean>(isPremium(session));

  useEffect(() => {
    if (authSession?.user && (authSession.user as any).isPro && !pro) {
      setPro(true);
      return;
    }
    let cancelled = false;
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
  if (!pro) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <UpsellModal open={true} onClose={() => router.push(`/list/${id}`)} />
      </main>
    );
  }

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

  function makeToken(bytes = 16) {
    if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
      // fallback
      return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
    const arr = new Uint8Array(bytes);
    window.crypto.getRandomValues(arr);
    const token = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
    const issuedAt = Date.now();
    return `${token}.${issuedAt}`;
  }

  function validateToken(token: string): { valid: boolean; expired: boolean } {
    if (!token || typeof token !== 'string') return { valid: false, expired: false };
    const parts = token.split('.');
    if (parts.length !== 2) {
      // Legacy token without timestamp; allow for backwards compatibility
      return { valid: true, expired: false };
    }
    const [tokenPart, issuedAtStr] = parts;
    const issuedAt = parseInt(issuedAtStr, 10);
    if (isNaN(issuedAt)) return { valid: false, expired: false };
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const expired = (now - issuedAt) > sevenDays;
    return { valid: true, expired };
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
      // Build structured invitees with role placeholders (tokens to be added later)
      const tempParticipants = (list as any).participants || (emails.length + 1) || 2;
      const tempPlan = computeNarrowingPlan(list.items.length, tempParticipants, { participants: tempParticipants });
      // keep existing tokens if present
      const existingMap = new Map<string, { role?: string; token?: string }>();
      const existing = (list.event?.invitees || []) as Array<string | { email: string; role?: string; token?: string; accepted?: boolean }>;
      for (const it of existing) {
        if (typeof it !== 'string') {
          existingMap.set(it.email.toLowerCase(), { role: it.role, token: it.token });
        }
      }
      const structured = emails.map((email, i) => {
        const { role } = getRoleName(tempParticipants, i);
        const prev = existingMap.get(email.toLowerCase());
        // Reuse existing valid token or generate new one
        let token = prev?.token;
        if (token) {
          const validation = validateToken(token);
          if (!validation.valid || validation.expired) {
            token = makeToken();
          }
        } else {
          token = makeToken();
        }
        return { email, role, token };
      });
      const updated: ChoosieList = {
        ...list,
        event: {
          ...(list.event || {}),
          invitees: structured,
          notes: notes?.trim() || undefined,
          visibility: list.event?.visibility || "link",
        },
      };
      upsertList(updated);
      setList(updated);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  // For virtual narrowing, link directly to the narrowing flow
  const link = `${origin}${basePath}/narrow/${updated.id}`;
      const listTypeName = list.moduleType === "books" ? "booklist" : 
                           list.moduleType === "food" ? "food list" :
                           list.moduleType === "music" ? "musiclist" :
                           list.moduleType === "karaoke" ? "karaoke list" :
                           list.moduleType === "anything" ? "list" : "watchlist";

      // Determine participants and plan, assign roles by email order (Organizer excluded)
      const participantsFinal = (updated as any).participants || (emails.length + 1) || 2; // default min 2
      const planFinal = computeNarrowingPlan(updated.items.length, participantsFinal, { participants: participantsFinal });
      const rounds = Math.min(emails.length, planFinal.length);
      const itemType = updated.moduleType === "movies" ? (planFinal[rounds - 1] === 1 ? "movie" : "movies")
                        : updated.moduleType === "books" ? (planFinal[rounds - 1] === 1 ? "book" : "books")
                        : updated.moduleType === "music" ? (planFinal[rounds - 1] === 1 ? "song" : "songs")
                        : updated.moduleType === "food" ? (planFinal[rounds - 1] === 1 ? "dish" : "dishes")
                        : (planFinal[rounds - 1] === 1 ? "favorite" : "favorites");
      const lines: string[] = [];
      for (let i = 0; i < rounds; i++) {
        const { role } = getRoleName(participantsFinal, i);
        const target = planFinal[i];
        lines.push(`${emails[i]} — ${role}: narrow to ${target} ${target === 1 ? itemType.slice(0, -1) || itemType : itemType}`);
      }
      const rolesBlock = lines.length
        ? `Roles and rounds (in order):\n${lines.map((l) => `• ${l}`).join("\n")}\n\n`
        : "";

      const subject = `Join my ${listTypeName}: ${updated.title}`;
      const body = `I just made a ${listTypeName} in Choosie.\n\n${rolesBlock}Open the narrowing link here: ${link}\n\nNo account needed. We’ll take turns by role until we pick a winner.\n\n—`;

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
  <h1 className="text-2xl font-semibold mb-1">Narrow virtually</h1>
        <p className="text-sm text-zinc-600 mb-6">Enter emails to send an invite with a link to the narrowing page. You can send via email or copy a link for text.</p>

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

        {/* Per-invite links (copy for SMS or individual emails) */}
        {list?.event?.invitees && Array.isArray(list.event.invitees) && list.event.invitees.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-base font-semibold mb-3">Per-invite links</h2>
            <p className="text-xs text-zinc-600 mb-3">
              Each person must use their unique link below. <b>Only one narrower can act at a time, in order.</b> Later narrowers must wait until it’s their turn. Share these links individually (ideal for texting or email).
            </p>
            <ul className="space-y-2">
              {(() => {
                const raw = list.event!.invitees! as Array<string | { email: string; role?: string; token?: string; accepted?: boolean }>;
                const emails = raw.filter((x) => typeof x !== 'string') as Array<{ email: string; role?: string; token?: string }>;
                const participants = (list as any).participants || (emails.length + 1) || 2;
                const plan = computeNarrowingPlan(list.items.length, participants, { participants });
                return emails.map((inv, i) => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
                  const link = `${origin}${basePath}/narrow/${list.id}?pt=${inv.token ?? ''}`;
                  const target = plan[i];
                  return (
                    <li key={inv.email} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{inv.email}</div>
                        <div className="text-xs text-zinc-600 truncate">{inv.role || 'Participant'} • Target: {typeof target === 'number' ? target : ''}</div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(link).then(() => alert('Link copied to clipboard'));
                        }}
                        className="rounded-full bg-white border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-zinc-50 flex-shrink-0"
                      >
                        Copy link
                      </button>
                    </li>
                  );
                });
              })()}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push(`/list/${list.id}`)}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Back to list
          </button>
          <div className="flex gap-2">
            <button
              onClick={saveAndSend}
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Preparing…" : "Send email invites"}
            </button>
            <button
              onClick={() => {
                if (!list) return;
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
                const link = `${origin}${basePath}/narrow/${list.id}`;
                navigator.clipboard.writeText(link).then(() => {
                  alert("Link copied. Paste it into an SMS or chat to text invites.");
                });
              }}
              className="rounded-full bg-white border border-brand px-5 py-2 text-sm font-semibold text-brand hover:bg-zinc-50"
            >
              Copy link for text
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
