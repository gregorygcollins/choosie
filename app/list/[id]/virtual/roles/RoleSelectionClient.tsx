"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getRolePlan } from "@/lib/planner";

type PreviewItem = {
  id: string;
  title: string;
  image?: string | null;
};

type RoleIconName = "cards" | "pencil" | "camera" | "slate" | "award";

const ROLE_ICONS: Record<string, RoleIconName> = {
  Curator: "cards",
  Editor: "pencil",
  Programmer: "camera",
  Selector: "slate",
  Decider: "award",
};

function RoleIcon({ icon }: { icon: RoleIconName }) {
  if (icon === "cards") {
    return (
      <svg aria-hidden="true" viewBox="0 0 32 32" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 10.5 20.5 6l3.5 10-12.5 4.5z" />
        <path d="M10 14.5v8A2.5 2.5 0 0 0 12.5 25h11A2.5 2.5 0 0 0 26 22.5v-8A2.5 2.5 0 0 0 23.5 12H22" />
        <path d="M14 18h7" />
        <path d="M14 21h5" />
      </svg>
    );
  }

  if (icon === "pencil") {
    return (
      <svg aria-hidden="true" viewBox="0 0 32 32" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 24.5 8.5 19 21 6.5a3 3 0 0 1 4.2 4.2L12.7 23.2z" />
        <path d="m19 8.5 4.5 4.5" />
        <path d="M8.5 19 13 23.5" />
        <path d="M7 24.5h6" />
      </svg>
    );
  }

  if (icon === "camera") {
    return (
      <svg aria-hidden="true" viewBox="0 0 32 32" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 12.5A3.5 3.5 0 0 1 10 9h9a3.5 3.5 0 0 1 3.5 3.5v7A3.5 3.5 0 0 1 19 23h-9a3.5 3.5 0 0 1-3.5-3.5z" />
        <path d="m22.5 14 4-2.4v8.8l-4-2.4" />
        <path d="M12 9 13.5 6.5h4L19 9" />
        <path d="M13 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" />
      </svg>
    );
  }

  if (icon === "slate") {
    return (
      <svg aria-hidden="true" viewBox="0 0 32 32" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 12h18v11.5A2.5 2.5 0 0 1 22.5 26h-13A2.5 2.5 0 0 1 7 23.5z" />
        <path d="M7 12 10 6h15v6" />
        <path d="M12 6 9 12" />
        <path d="M18 6 15 12" />
        <path d="M24 6 21 12" />
        <path d="M13 18h6" />
        <path d="M13 21h4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 7h10v5.5A8.5 8.5 0 0 1 16 20a8.5 8.5 0 0 1-5-7.5z" />
      <path d="M11 10H8.5A3.5 3.5 0 0 0 5 13.5C5 16 7 18 10 18.5" />
      <path d="M21 10h2.5a3.5 3.5 0 0 1 3.5 3.5c0 2.5-2 4.5-5 5" />
      <path d="M16 20v4" />
      <path d="M12 26h8" />
      <path d="M14 24h4" />
    </svg>
  );
}

function RoleSelectionContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") || "";
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantCount, setParticipantCount] = useState<number>(3);
  const [listTitle, setListTitle] = useState("this list");
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [name, setName] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchParticipantsAndCount() {
      try {
        const query = new URLSearchParams({ listId: String(id) });
        if (sessionId) query.set("sessionId", sessionId);
        const res = await fetch(`/api/choosie/narrow/participants?${query.toString()}`);
        const data = await res.json();
        if (!cancelled && data.ok) setParticipants(data.participants);
      } catch {}
      try {
        const res2 = await fetch("/api/choosie/narrow/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: id }),
          cache: "no-store",
        });
        const data2 = await res2.json();
        if (!cancelled && data2.ok && typeof data2.participantCount === "number") {
          setParticipantCount(data2.participantCount);
        }
        if (!cancelled && data2.ok && data2.listTitle) {
          setListTitle(data2.listTitle);
        }
        if (!cancelled && data2.ok && Array.isArray(data2.items)) {
          setPreviewItems(data2.items.slice(0, 10));
        }
      } catch {}
    }
    fetchParticipantsAndCount();
    const interval = setInterval(fetchParticipantsAndCount, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id, sessionId]);

  async function claimRole(role: string) {
    setClaiming(role);
    setError(null);
    try {
      const res = await fetch("/api/choosie/narrow/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: id, name, role, sessionId }),
      });
      const data = await res.json();
      if (data.ok) {
        const idx = rolesToShow.findIndex((r) => r.role === role);
        if (idx === 0) {
          router.push(`/list/${id}/virtual?pt=${idx}&start=1${sessionId ? `&session=${encodeURIComponent(sessionId)}` : ""}`);
        } else {
          router.push(`/list/${id}/virtual?pt=${idx}${sessionId ? `&session=${encodeURIComponent(sessionId)}` : ""}`);
        }
      } else {
        setError(data.error || "Failed to claim role");
      }
    } catch {
      setError("Failed to claim role");
    }
    setClaiming(null);
  }

  const rolesToShow = getRolePlan(participantCount + 1).map((phase) => ({
    ...phase,
    icon: ROLE_ICONS[phase.role] || "slate",
  }));

  const posterItems = previewItems.filter((item) => item.image).slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
        You&apos;ve been invited to choosie a movie.
      </p>
      <h1 className="mt-4 text-3xl font-bold text-brand sm:text-4xl">{listTitle}</h1>
      {previewItems.length > 0 && (
        <div className="mx-auto mt-5 max-w-2xl">
          {posterItems.length > 0 ? (
            <div className="overflow-x-auto pb-1">
              <div className="mx-auto flex w-max max-w-full flex-nowrap justify-center -space-x-2 px-2">
                {posterItems.map((item) => (
                  <img
                    key={item.id}
                    src={item.image || ""}
                    alt=""
                    className="h-20 w-14 shrink-0 rounded-md border-2 border-white object-cover shadow-sm ring-1 ring-brand/10"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-md flex-wrap justify-center gap-2">
              {previewItems.slice(0, 4).map((item) => (
                <span key={item.id} className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/10">
                  {item.title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="mt-3 text-lg font-semibold text-zinc-700">Choosie your role.</p>

      <div className="mx-auto mt-8 max-w-md text-left">
        <label htmlFor="narrower-name" className="block text-sm font-semibold text-brand">
          Enter your name to join
        </label>
        <input
          id="narrower-name"
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-consensus/40"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          disabled={!!claiming}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {rolesToShow.map(({ role, target, icon }) => {
          const taken = participants.find((p) => p.role === role);
          return (
            <div
              key={role}
              className={`flex min-h-48 flex-col items-center justify-between rounded-2xl border p-5 shadow-sm ${
                taken ? "border-zinc-200 bg-zinc-50 text-zinc-400" : "border-brand/20 bg-white text-brand"
              }`}
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-light text-brand ring-1 ring-brand/10">
                <RoleIcon icon={icon} />
              </div>
              <div className="mt-4 text-center text-zinc-900">
                <div className="text-lg font-bold leading-tight">{role}</div>
                <div className="mt-1 text-base font-semibold leading-tight text-zinc-700">Narrow to {target}</div>
              </div>
              {taken ? (
                <div className="mt-3 text-sm text-zinc-500">Claimed by {taken.name}</div>
              ) : (
                <button
                  className="mt-4 rounded-full bg-consensus px-4 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-consensus-dark disabled:opacity-60"
                  disabled={!name || !!claiming}
                  onClick={() => claimRole(role)}
                >
                  {claiming === role ? "Claiming..." : "Claim Role"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      <div className="mx-auto mt-5 max-w-md text-xs leading-5 text-zinc-500">
        You can join as any available role. The narrowing session begins as soon as a role is claimed.
      </div>
    </div>
  );
}

export function RoleSelectionClient() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="mx-auto max-w-xl p-6 text-zinc-600">Loading roles...</div>}>
        <RoleSelectionContent />
      </Suspense>
    </ErrorBoundary>
  );
}
