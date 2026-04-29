"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getRoleName } from "@/lib/planner";

const ROLE_META: Record<string, { choosie: number; emoji: string }> = {
  Programmer: { choosie: 5, emoji: "💻" },
  Selector: { choosie: 3, emoji: "🎯" },
  Decider: { choosie: 1, emoji: "🏆" },
};

function RoleSelectionContent() {
  const { id } = useParams();
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantCount, setParticipantCount] = useState<number>(3);
  const [name, setName] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch participants and participant count
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchParticipantsAndCount() {
      try {
        const res = await fetch(`/api/choosie/narrow/participants?listId=${id}`);
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
      } catch {}
    }
    fetchParticipantsAndCount();
    const interval = setInterval(fetchParticipantsAndCount, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id]);

  // Handle role claim
  async function claimRole(role: string) {
    setClaiming(role);
    setError(null);
    try {
      const res = await fetch("/api/choosie/narrow/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: id, name, role }),
      });
      const data = await res.json();
      if (data.ok) {
        // Go to narrowing session with role index as pt
        const idx = rolesToShow.findIndex((r) => r.role === role);
        // If this is the first narrower (lowest idx), allow immediate narrowing
        if (idx === 0) {
          router.push(`/list/${id}/virtual?pt=${idx}&start=1`);
        } else {
          router.push(`/list/${id}/virtual?pt=${idx}`);
        }
      } else {
        setError(data.error || "Failed to claim role");
      }
    } catch {
      setError("Failed to claim role");
    }
    setClaiming(null);
  }

  // Compute roles to show based on participantCount (number of narrowers)
  let rolesToShow: { role: string; choosie: number; emoji: string }[] = [];
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
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Choose Your Role</h1>
      <div className="mb-4">Enter your name to join:</div>
      <input
        className="border rounded px-3 py-2 mb-4 w-full"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your name"
        disabled={!!claiming}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {rolesToShow.map(({ role, choosie, emoji }) => {
          const taken = participants.find((p) => p.role === role);
          return (
            <div key={role} className={`rounded border p-4 flex flex-col items-center ${taken ? "bg-zinc-100 border-zinc-300" : "bg-white border-brand"}`}>
              <div className="text-3xl mb-2">{emoji}</div>
              <div className="font-bold mb-1">{role}</div>
              <div className="text-zinc-500 mb-2">Choosie {choosie}</div>
              {taken ? (
                <div className="text-zinc-400 text-sm">Claimed by {taken.name}</div>
              ) : (
                <button
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 mt-2 disabled:opacity-60"
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
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <div className="text-zinc-500 text-xs">You can join as any available role. The narrowing session begins as soon as a role is claimed.</div>
    </div>
  );
}

export default function RoleSelectionPage() {
  return (
    <ErrorBoundary>
      <RoleSelectionContent />
    </ErrorBoundary>
  );
}
