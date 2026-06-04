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

function getModuleTheme(module: string) {
  if (module === "books") {
    return {
      pageBg: "bg-gradient-to-b from-blue-50/65 via-white to-white",
      title: "text-blue-900",
      accent: "text-blue-700",
      ring: "ring-blue-100",
      icon: "bg-blue-100 text-blue-700",
      claim: "bg-blue-600 text-white hover:bg-blue-700",
    };
  }
  if (module === "music") {
    return {
      pageBg: "bg-gradient-to-b from-violet-50/65 via-white to-white",
      title: "text-violet-900",
      accent: "text-violet-700",
      ring: "ring-violet-100",
      icon: "bg-violet-100 text-violet-700",
      claim: "bg-violet-600 text-white hover:bg-violet-700",
    };
  }
  if (module === "food" || module === "recipes") {
    return {
      pageBg: "bg-gradient-to-b from-emerald-50/65 via-white to-white",
      title: "text-emerald-900",
      accent: "text-emerald-700",
      ring: "ring-emerald-100",
      icon: "bg-emerald-100 text-emerald-700",
      claim: "bg-emerald-600 text-white hover:bg-emerald-700",
    };
  }
  if (module === "anything") {
    return {
      pageBg: "bg-gradient-to-b from-rose-50/65 via-white to-white",
      title: "text-rose-900",
      accent: "text-rose-700",
      ring: "ring-rose-100",
      icon: "bg-rose-100 text-rose-700",
      claim: "bg-rose-600 text-white hover:bg-rose-700",
    };
  }
  return {
    pageBg: "bg-gradient-to-b from-[#f3f7f7] via-white to-white",
    title: "text-brand",
    accent: "text-brand",
    ring: "ring-[#d6e3e2]",
    icon: "bg-[#eef4f4] text-brand",
    claim: "bg-teal-600 text-white hover:bg-teal-700",
  };
}

function roleStorageKey(listId: string, sessionId: string) {
  return `choosie:virtual-role:${listId}:${sessionId || "default"}`;
}

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
  const [listModule, setListModule] = useState("movies");
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
        if (!cancelled && data2.ok && data2.listModule) {
          setListModule(String(data2.listModule));
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

  useEffect(() => {
    if (!id) return;
    try {
      const raw = window.localStorage.getItem(roleStorageKey(String(id), sessionId));
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw);
      const savedIndex = Number(saved?.participantIndex);
      const savedRole = typeof saved?.role === "string" ? saved.role : "";
      if (!Number.isFinite(savedIndex) || !savedRole) {
        return;
      }

      const claim = participants.find((participant) => participant.role === savedRole);
      if (participants.length > 0 && claim && saved?.name && claim.name !== saved.name) {
        window.localStorage.removeItem(roleStorageKey(String(id), sessionId));
        return;
      }

      router.replace(`/list/${id}/virtual?pt=${savedIndex}${sessionId ? `&session=${encodeURIComponent(sessionId)}` : ""}`);
    } catch {}
  }, [id, participants, router, sessionId]);

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
        try {
          window.localStorage.setItem(roleStorageKey(String(id), sessionId), JSON.stringify({
            participantIndex: idx,
            role,
            name,
            sessionId,
          }));
        } catch {}
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

  const posterItems = previewItems.filter((item) => item.image).slice(0, 12);
  const moduleTheme = getModuleTheme(listModule);

  return (
    <main className={["min-h-screen", moduleTheme.pageBg].join(" ")}>
      <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 sm:py-16">
      <p className={["text-base font-semibold uppercase tracking-[0.36em]", moduleTheme.accent].join(" ")}>
        TIME TO CHOOSIE
      </p>
      <h1 className={["mx-auto mt-6 max-w-5xl break-words text-4xl font-bold leading-tight sm:text-7xl", moduleTheme.title].join(" ")}>{listTitle}</h1>
      {previewItems.length > 0 && (
        <div className="mx-auto mt-8 max-w-5xl">
          {posterItems.length > 0 ? (
            <div className="overflow-x-auto pb-3">
              <div className="mx-auto flex w-max max-w-full flex-nowrap justify-center -space-x-1 px-3">
                {posterItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border-[3px] border-white bg-zinc-950 shadow-lg ring-1 ring-brand/10 transition hover:z-10 hover:-translate-y-1 hover:scale-110 sm:h-36 sm:w-24"
                    style={{ transform: `translateY(${Math.abs(index - (posterItems.length - 1) / 2) * 1.5}px)` }}
                  >
                    <img
                      src={item.image || ""}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
              {previewItems.slice(0, 8).map((item) => (
                <span key={item.id} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm ring-1 ring-brand/10">
                  {item.title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="mt-9 text-2xl font-bold text-zinc-700 sm:text-3xl">Choosie your role.</p>

      <div className="mx-auto mt-10 max-w-2xl text-left">
        <label htmlFor="narrower-name" className={["block text-xl font-bold", moduleTheme.title].join(" ")}>
          Enter your name to join
        </label>
        <input
          id="narrower-name"
          className="mt-4 w-full rounded-2xl border border-brand/10 bg-white px-6 py-5 text-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-consensus/40"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          disabled={!!claiming}
        />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-6">
        {rolesToShow.map(({ role, target, icon }) => {
          const taken = participants.find((p) => p.role === role);
          return (
            <div
              key={role}
              className={`flex min-h-72 w-full max-w-72 flex-col items-center justify-between rounded-2xl border p-8 shadow-soft transition sm:w-72 ${
                taken ? "border-zinc-200 bg-zinc-50 text-zinc-400 opacity-70" : "border-brand/10 bg-white text-brand hover:-translate-y-1 hover:border-consensus/50 hover:shadow-xl"
              }`}
            >
                <div className={["grid h-24 w-24 place-items-center rounded-full ring-1", moduleTheme.icon, moduleTheme.ring].join(" ")}>
                <RoleIcon icon={icon} />
              </div>
              <div className="mt-8 text-center text-zinc-950">
                <div className="text-3xl font-bold leading-tight">{role}</div>
                <div className="mt-3 text-2xl font-bold leading-tight text-zinc-700">Narrow to {target}</div>
              </div>
              {taken ? (
                <div className="mt-6 text-base font-semibold text-zinc-500">Claimed by {taken.name}</div>
              ) : (
                <button
                  className={["mt-8 rounded-full px-6 py-3 text-base font-bold shadow-lg transition-colors disabled:opacity-60", moduleTheme.claim].join(" ")}
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
    </main>
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
