"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";

const ROLE_META: Record<string, { target: number; icon: "camera" | "slate" | "award" }> = {
  Programmer: { target: 5, icon: "camera" },
  Selector: { target: 3, icon: "slate" },
  Decider: { target: 1, icon: "award" },
};

function RoleIcon({ icon }: { icon: "camera" | "slate" | "award" }) {
  if (icon === "camera") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h7A2.5 2.5 0 0 1 16 8.5v7A2.5 2.5 0 0 1 13.5 18h-7A2.5 2.5 0 0 1 4 15.5z" />
        <path d="m16 10 4-2.5v9L16 14" />
        <path d="M7 6 8.5 3.5h3L13 6" />
      </svg>
    );
  }

  if (icon === "slate") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 8h16v10.5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5z" />
        <path d="M4 8 6.4 3h3L7 8" />
        <path d="M10 8 12.4 3h3L13 8" />
        <path d="M16 8 18.4 3H20v5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3c1.4 1.4 2.2 3 2.2 4.8 0 2.4-1 4.2-2.2 5.2-1.2-1-2.2-2.8-2.2-5.2C9.8 6 10.6 4.4 12 3Z" fill="currentColor" stroke="none" />
      <path d="M8.5 8.5H6.8A2.8 2.8 0 0 0 4 11.3c0 2.1 1.7 3.9 4 4.2" />
      <path d="M15.5 8.5h1.7a2.8 2.8 0 0 1 2.8 2.8c0 2.1-1.7 3.9-4 4.2" />
      <path d="M12 13v4" />
      <path d="M9 21h6" />
      <path d="M10 17h4l1 4H9z" />
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
  const [name, setName] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch participants and participant count
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
        const res2 = await fetch("/api/choosie/getList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: id }),
          credentials: "include",
        });
        const data2 = await res2.json();
        if (!cancelled && data2.ok && typeof data2.list?.participants === "number") {
          setParticipantCount(data2.list.participants);
        }
        if (!cancelled && data2.ok && data2.list?.title) {
          setListTitle(data2.list.title);
        }
      } catch {}
    }
    fetchParticipantsAndCount();
    const interval = setInterval(fetchParticipantsAndCount, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id, sessionId]);

  // Handle role claim
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
        // Go to narrowing session with role index as pt
        const idx = rolesToShow.findIndex((r) => r.role === role);
        // If this is the first narrower (lowest idx), allow immediate narrowing
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

  // Always show exactly participantCount roles (1=Decider, 2=Selector+Decider, 3=Programmer+Selector+Decider)
  let rolesToShow: { role: string; target: number; icon: "camera" | "slate" | "award" }[] = [];
  if (participantCount === 1) {
    rolesToShow = [{ role: "Decider", ...ROLE_META["Decider"] }];
  } else if (participantCount === 2) {
    rolesToShow = [
      { role: "Selector", ...ROLE_META["Selector"] },
      { role: "Decider", ...ROLE_META["Decider"] },
    ];
  } else if (participantCount === 3) {
    rolesToShow = [
      { role: "Programmer", ...ROLE_META["Programmer"] },
      { role: "Selector", ...ROLE_META["Selector"] },
      { role: "Decider", ...ROLE_META["Decider"] },
    ];
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
        You&apos;ve been invited to choosie a movie.
      </p>
      <h1 className="mt-4 text-3xl font-bold text-brand sm:text-4xl">{listTitle}</h1>
      <p className="mt-3 text-lg font-semibold text-zinc-700">Choose your role.</p>

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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {rolesToShow.map(({ role, target, icon }) => {
          const taken = participants.find((p) => p.role === role);
          return (
            <div
              key={role}
              className={`flex min-h-48 flex-col items-center justify-between rounded-2xl border p-5 shadow-sm ${
                taken ? "border-zinc-200 bg-zinc-50 text-zinc-400" : "border-brand/20 bg-white text-brand"
              }`}
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-light text-brand">
                <RoleIcon icon={icon} />
              </div>
              <div className="mt-4 text-center text-base font-bold text-zinc-900">
                {role}: Narrow to {target}
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

export default function RoleSelectionPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="mx-auto max-w-xl p-6 text-zinc-600">Loading roles...</div>}>
        <RoleSelectionContent />
      </Suspense>
    </ErrorBoundary>
  );
}
