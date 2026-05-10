import React, { useEffect, useRef, useState } from "react";
import { getRoleName } from "@/lib/planner";

type NarrowingItem = {
  id: string;
  name: string;
  notes?: string | null;
  image?: string | null;
  status?: "active" | "cut";
};

type ParticipantClaim = {
  name: string;
  role: string;
  joined?: boolean;
};

type ActivityLogEntry = {
  id: string;
  text: string;
  title: string;
  image?: string | null;
  role: string;
};

type NarrowingPanelProps = {
  listTitle: string;
  listDescription?: string | null;
  items: NarrowingItem[];
  mode: "in-person" | "virtual";
  roundIndex: number;
  plan: number[];
  selectedIds: string[];
  target: number;
  winnerId?: string | null;
  participantCount: number;
  participantIndex?: number;
  viewerRole?: string;
  isSpectator?: boolean;
  participants?: ParticipantClaim[];
  activityLog?: ActivityLogEntry[];
  busy?: boolean;
  error?: string | null;
  onToggleItem: (id: string) => void;
  onReorderItems: (from: number, to: number) => void;
  onConfirm: () => void;
  onSurpriseMe: () => void;
  onUndo: () => void;
  onReset: () => void;
  onReturnToList: () => void;
  onShareWinner: () => void;
  moduleType?: string;
};

type RoleIconName = "cards" | "pencil" | "camera" | "slate" | "award";

const ROLE_ICONS: Record<string, RoleIconName> = {
  Curator: "cards",
  Editor: "pencil",
  Programmer: "camera",
  Selector: "slate",
  Decider: "award",
};

function RoleIcon({ role }: { role: string }) {
  const icon = ROLE_ICONS[role] || "slate";
  const commonProps = {
    "aria-hidden": true,
    viewBox: "0 0 32 32",
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (icon === "cards") {
    return (
      <svg {...commonProps}>
        <path d="M8 10.5 20.5 6l3.5 10-12.5 4.5z" />
        <path d="M10 14.5v8A2.5 2.5 0 0 0 12.5 25h11A2.5 2.5 0 0 0 26 22.5v-8A2.5 2.5 0 0 0 23.5 12H22" />
        <path d="M14 18h7" />
        <path d="M14 21h5" />
      </svg>
    );
  }

  if (icon === "pencil") {
    return (
      <svg {...commonProps}>
        <path d="M7 24.5 8.5 19 21 6.5a3 3 0 0 1 4.2 4.2L12.7 23.2z" />
        <path d="m19 8.5 4.5 4.5" />
        <path d="M8.5 19 13 23.5" />
        <path d="M7 24.5h6" />
      </svg>
    );
  }

  if (icon === "camera") {
    return (
      <svg {...commonProps}>
        <path d="M6.5 12.5A3.5 3.5 0 0 1 10 9h9a3.5 3.5 0 0 1 3.5 3.5v7A3.5 3.5 0 0 1 19 23h-9a3.5 3.5 0 0 1-3.5-3.5z" />
        <path d="m22.5 14 4-2.4v8.8l-4-2.4" />
        <path d="M12 9 13.5 6.5h4L19 9" />
        <path d="M13 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" />
      </svg>
    );
  }

  if (icon === "slate") {
    return (
      <svg {...commonProps}>
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
    <svg {...commonProps}>
      <path d="M11 7h10v5.5A8.5 8.5 0 0 1 16 20a8.5 8.5 0 0 1-5-7.5z" />
      <path d="M11 10H8.5A3.5 3.5 0 0 0 5 13.5C5 16 7 18 10 18.5" />
      <path d="M21 10h2.5a3.5 3.5 0 0 1 3.5 3.5c0 2.5-2 4.5-5 5" />
      <path d="M16 20v4" />
      <path d="M12 26h8" />
      <path d="M14 24h4" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-1" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.6 6.8-4.2" />
      <path d="m8.6 13.4 6.8 4.2" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}

function ConfettiBurst() {
  const pieces = [
    { className: "left-[8%] top-[14%] bg-brand", x: -12, delay: 0 },
    { className: "left-[18%] top-[30%] bg-consensus", x: 10, delay: 90 },
    { className: "left-[30%] top-[10%] bg-pink-400", x: -6, delay: 180 },
    { className: "left-[42%] top-[24%] bg-sky-400", x: 14, delay: 270 },
    { className: "right-[8%] top-[16%] bg-brand", x: 12, delay: 45 },
    { className: "right-[20%] top-[32%] bg-consensus", x: -10, delay: 135 },
    { className: "right-[32%] top-[12%] bg-pink-400", x: 8, delay: 225 },
    { className: "right-[44%] top-[26%] bg-sky-400", x: -14, delay: 315 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>
        {`
          @keyframes choosie-confetti-pop {
            0% { opacity: 0; transform: translate3d(0, -18px, 0) rotate(0deg) scale(.7); }
            18% { opacity: 1; }
            62% { opacity: 1; transform: translate3d(var(--confetti-x), 36px, 0) rotate(170deg) scale(1); }
            100% { opacity: 0; transform: translate3d(calc(var(--confetti-x) * 1.8), 78px, 0) rotate(310deg) scale(.9); }
          }

          @keyframes choosie-winner-glow {
            0%, 100% { opacity: .42; transform: translateX(-50%) scale(.95); }
            50% { opacity: .82; transform: translateX(-50%) scale(1.12); }
          }
        `}
      </style>
      {pieces.map((piece) => (
        <span
          key={`${piece.className}-${piece.delay}`}
          className={`absolute h-3 w-1.5 rounded-full shadow-sm ${piece.className}`}
          style={{
            animation: "choosie-confetti-pop 1500ms ease-out infinite",
            animationDelay: `${piece.delay}ms`,
            ["--confetti-x" as string]: `${piece.x}px`,
          }}
        />
      ))}
      <span className="absolute left-[12%] top-[48%] text-2xl" style={{ animation: "choosie-confetti-pop 1800ms ease-out infinite" }}>
        🎉
      </span>
      <span className="absolute right-[12%] top-[48%] text-2xl" style={{ animation: "choosie-confetti-pop 1800ms ease-out 220ms infinite" }}>
        ✨
      </span>
      <div
        className="absolute left-1/2 top-8 h-16 w-16 -translate-x-1/2 rounded-full bg-consensus/40 blur-2xl"
        style={{ animation: "choosie-winner-glow 1800ms ease-in-out infinite" }}
      />
    </div>
  );
}

export const NarrowingPanel: React.FC<NarrowingPanelProps> = ({
  listTitle,
  listDescription,
  items,
  mode,
  roundIndex,
  plan,
  selectedIds,
  target,
  winnerId,
  participantCount,
  participantIndex = 0,
  viewerRole,
  isSpectator = false,
  participants = [],
  activityLog = [],
  busy = false,
  error,
  onToggleItem,
  onReorderItems,
  onConfirm,
  onSurpriseMe,
  onUndo,
  onReset,
  onReturnToList,
  onShareWinner,
  moduleType,
}) => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [infoItem, setInfoItem] = useState<NarrowingItem | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const actionLogRef = useRef<HTMLDivElement | null>(null);
  const role = getRoleName(participantCount + 1, roundIndex);
  const participantRole = viewerRole ? { role: viewerRole, emoji: "" } : getRoleName(participantCount + 1, participantIndex);
  const activeParticipantIndex = roundIndex % Math.max(1, participantCount);
  const isVirtualWaiting = mode === "virtual" && (isSpectator || participantIndex !== activeParticipantIndex) && !winnerId;
  const winner = winnerId ? items.find((item) => item.id === winnerId) : null;
  const canConfirm = !busy && !isVirtualWaiting && selectedIds.length === target;
  const previousParticipantIndex = Math.max(0, roundIndex - 1) % Math.max(1, participantCount);
  const canUndo =
    !busy &&
    roundIndex > 0 &&
    (mode === "in-person" || participantIndex === previousParticipantIndex);
  const itemGridClass = view === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
  const displayedRole = role;
  const displayedTarget = target;
  const displayedRound = roundIndex;
  const roundsUntilTurn = isSpectator
    ? null
    : participantIndex >= roundIndex
    ? participantIndex - roundIndex
    : null;
  const waitLine =
    roundsUntilTurn == null
      ? "Your turn is complete. Watch the rest unfold."
      : `You're up in ${roundsUntilTurn === 0 ? 1 : roundsUntilTurn} round${roundsUntilTurn === 1 ? "" : "s"}.`;
  const activeClaim = participants.find((participant) => participant.role === role.role);
  const activeName = activeClaim?.name || role.role;
  const normalizedModule = String(moduleType || "movies").toLowerCase();
  const itemNoun =
    normalizedModule === "books"
      ? "books"
      : normalizedModule === "music"
      ? "songs"
      : normalizedModule === "food" || normalizedModule === "recipes"
      ? "dishes"
      : normalizedModule === "anything"
      ? "options"
      : "movies";
  const singularNoun = itemNoun === "movies" ? "movie" : itemNoun === "dishes" ? "dish" : itemNoun === "options" ? "option" : itemNoun.slice(0, -1);
  const activeAction = role.role === "Decider" ? `choosing their ${singularNoun}` : `choosing ${target} ${itemNoun}`;
  const taskLabel = role.role === "Decider" ? `Choosie your ${singularNoun}` : `Choosie ${target} ${itemNoun}`;
  const turnFlash = mode === "virtual" && !isVirtualWaiting && !winner;
  const actionText = winner
    ? "And the winner is..."
    : isVirtualWaiting
    ? `${activeName} is ${activeAction}.`
    : displayedRole.role === "Decider"
    ? "Time to choosie."
    : `Choosie ${displayedTarget} options.`;
  const rolePlan = plan.map((phaseTarget, index) => ({
    ...getRoleName(participantCount + 1, index),
    target: phaseTarget,
  }));

  useEffect(() => {
    const node = actionLogRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [activityLog]);

  function onDragStart(event: React.DragEvent, index: number) {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    try {
      event.dataTransfer.setData("text/plain", String(index));
    } catch {}
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function onDrop(event: React.DragEvent, index: number) {
    event.preventDefault();
    let from = dragIndex;
    try {
      const raw = event.dataTransfer.getData("text/plain");
      if (raw) from = Number(raw);
    } catch {}
    setDragIndex(null);
    if (from != null && Number.isFinite(from)) onReorderItems(from, index);
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {mode === "in-person" ? "In Person Narrowing" : "Virtual Narrowing"}
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-brand sm:text-4xl">
                {listTitle}
              </h1>
              <p className={`mt-2 text-lg font-semibold sm:text-xl ${turnFlash ? "animate-pulse text-consensus-dark" : "text-zinc-700"}`}>
                {turnFlash ? taskLabel : actionText}
              </p>
              {!winner && (
                <p className="mt-2 inline-flex items-center justify-center gap-2 text-sm text-zinc-500">
                  <span className="text-brand" aria-hidden="true">
                    <RoleIcon role={displayedRole.role} />
                  </span>
                  <span>
                    {taskLabel}
                  </span>
                </p>
              )}
            </div>
            {!winner && (
              <div className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
                Round {Math.min(displayedRound + 1, plan.length)} of {plan.length}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {!winner && (
              <p className="text-sm text-zinc-600">
                {isVirtualWaiting
                  ? isSpectator
                    ? `Watching ${role.role}'s turn in real time.`
                    : waitLine
                  : "Select and confirm your choices!"}
              </p>
            )}
            {!winner && (
              <div className="inline-flex w-fit rounded-md border border-zinc-200 bg-white p-1">
                <button
                  type="button"
                  title="Grid view"
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                  className={`rounded px-2.5 py-1.5 transition-colors ${
                    view === "grid" ? "bg-brand text-white" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <GridIcon />
                </button>
                <button
                  type="button"
                  title="List view"
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  className={`rounded px-2.5 py-1.5 transition-colors ${
                    view === "list" ? "bg-brand text-white" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <ListIcon />
                </button>
              </div>
            )}
          </div>
        </div>

        {winner ? (
          <div className="relative overflow-hidden px-5 py-12 text-center sm:px-6">
            <ConfettiBurst />
            {winner?.image && (
              <img
                src={winner.image}
                alt=""
                className="relative mx-auto mb-5 h-36 w-36 rounded-lg object-cover shadow-lg ring-4 ring-consensus/50"
              />
            )}
            <div className="relative mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-consensus text-2xl shadow-sm">
              🎉
            </div>
            <div className="relative mt-2 text-4xl font-semibold text-brand">{winner?.name || "Winner"}</div>
          </div>
        ) : (
          <div className="px-5 py-5 sm:px-6">
            {mode === "virtual" && (
              <div className="mb-4 flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 sm:items-center sm:justify-center">
                <div className="flex flex-col items-center w-full">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 text-center">Lobby</div>
                  <div className="mt-2 flex flex-wrap gap-2 justify-center w-full">
                    {rolePlan.map((phase) => {
                      const claim = participants.find((participant) => participant.role === phase.role);
                      const isActive = phase.role === role.role;
                      return (
                        <span
                          key={phase.role}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            isActive
                              ? "border-consensus bg-consensus/30 text-brand-dark"
                              : claim
                              ? "border-zinc-200 bg-white text-zinc-700"
                              : "border-zinc-200 bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${claim ? "bg-consensus" : "bg-zinc-300"}`} />
                          {phase.role}
                          {claim ? ` - ${claim.name}` : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {isSpectator && (
                  <div className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand ring-1 ring-zinc-200">
                    Organizer view
                  </div>
                )}
              </div>
            )}

            {mode === "virtual" && isVirtualWaiting && (
              <div className="mb-4 rounded-md border border-consensus/50 bg-consensus/10 px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-brand">Live spectator mode</div>
                <div className="mt-1 text-base font-semibold text-zinc-950">
                  {activeName} is currently {activeAction}.
                </div>
                <div className="mt-1 text-sm leading-6 text-zinc-600">
                  {isSpectator
                    ? "You are the Organizer. The list updates as each narrower makes cuts."
                    : `You are the ${participantRole.role}. ${waitLine}`}
                </div>
              </div>
            )}

            <div className="relative">
            <div className={`grid gap-3 ${itemGridClass}`}>
              {[...items]
                .sort((a, b) => {
                  // Grey out and move cut items to the bottom visually
                  if ((a.status === "cut") === (b.status === "cut")) return 0;
                  return a.status === "cut" ? 1 : -1;
                })
                .map((item, index) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      draggable={!busy && !isVirtualWaiting}
                      onDragStart={(event) => onDragStart(event, index)}
                      onDragOver={onDragOver}
                      onDrop={(event) => onDrop(event, index)}
                      onDragEnd={() => setDragIndex(null)}
                      className={`flex min-h-20 items-center gap-3 rounded-lg border p-3 transition-all duration-500 ${
                        item.status === "cut"
                          ? "opacity-60 grayscale border-zinc-200 bg-zinc-50"
                          : checked
                          ? "border-consensus bg-consensus/10"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="cursor-grab text-zinc-400" title="Drag to reorder" aria-hidden="true">
                        <GripIcon />
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleItem(item.id)}
                        disabled={busy || isVirtualWaiting}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
                      >
                        {item.image ? (
                          <img src={item.image} alt="" className={`h-14 w-14 shrink-0 rounded-md object-cover ${item.status === "cut" ? "opacity-60 grayscale" : ""}`} />
                        ) : (
                          <div className={`h-14 w-14 shrink-0 rounded-md bg-zinc-100 ${item.status === "cut" ? "opacity-60 grayscale" : ""}`} />
                        )}
                        <span className="min-w-0">
                          <span className={`block truncate text-sm font-semibold ${item.status === "cut" ? "text-zinc-400" : "text-zinc-950"}`}>{item.name}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        title={`More about ${item.name}`}
                        aria-label={`More about ${item.name}`}
                        onClick={() => setInfoItem(item)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:bg-white hover:text-zinc-950"
                      >
                        <InfoIcon />
                      </button>
                      <span className="sr-only">
                        {item.notes && (
                          <>
                            {" "}
                            {item.notes}
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
            </div>
            </div>

            {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <div className="mt-5 text-sm text-zinc-600">
              Selected {selectedIds.length} of {target}
            </div>
            {mode === "virtual" && (
              <div ref={actionLogRef} className="mt-4 max-h-56 overflow-y-auto rounded-md border border-consensus/40 bg-consensus/10 p-3 text-sm text-zinc-700">
                <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-brand">Cut pile</div>
                {activityLog.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {activityLog.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white/85 p-2 text-left shadow-sm">
                        {entry.image ? (
                          <img src={entry.image} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover opacity-65 grayscale" />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded-md bg-zinc-200" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-700">{entry.title}</div>
                          <div className="text-xs text-zinc-500">Cut by {entry.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-white/70 px-3 py-4 text-center text-zinc-500">Cut options will stack here as the room narrows.</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-row flex-nowrap items-center justify-between gap-3 overflow-x-auto border-t border-zinc-200 px-5 py-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            {!winner && (
              <>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!canConfirm}
                  className="inline-grid h-11 w-11 place-items-center rounded-full bg-consensus text-brand-dark transition-colors hover:bg-consensus-dark disabled:cursor-not-allowed disabled:opacity-50 glow-consensus"
                  title="Confirm"
                  aria-label="Confirm selections"
                >
                  <CheckIcon />
                </button>
                <button
                  type="button"
                  onClick={onSurpriseMe}
                  disabled={busy || isVirtualWaiting || items.length < target}
                  className="inline-flex items-center gap-2 rounded-full border border-consensus/60 bg-white px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-consensus/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShuffleIcon />
                  Surprise me
                </button>
              </>
            )}
            {winner && (
              <button
                type="button"
                onClick={onShareWinner}
                title="Share winner"
                aria-label="Share winner"
                className="inline-grid h-10 w-10 place-items-center rounded-full bg-consensus text-brand-dark transition-colors hover:bg-consensus-dark glow-consensus"
              >
                <ShareIcon />
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={onReturnToList}
              title="Return to list"
              aria-label="Return to list"
              className="inline-grid h-10 w-10 place-items-center rounded-full text-brand transition-colors hover:bg-brand-light hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <ReturnIcon />
            </button>
            {mode === "in-person" && (
              <>
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo"
                  aria-label="Undo"
                  className="inline-grid h-10 w-10 place-items-center rounded-full text-brand transition-colors hover:bg-brand-light hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UndoIcon />
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  disabled={busy}
                  title="Reset list"
                  aria-label="Reset list"
                  className="inline-grid h-10 w-10 place-items-center rounded-full text-brand transition-colors hover:bg-brand-light hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ResetIcon />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {infoItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setInfoItem(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="narrowing-info-title"
            onClick={(event) => event.stopPropagation()}
          >
            {infoItem.image && (
              <img src={infoItem.image} alt="" className="mb-4 h-48 w-full rounded-lg object-cover" />
            )}
            <div id="narrowing-info-title" className="text-xl font-semibold text-zinc-950">
              {infoItem.name}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
              {infoItem.notes || "No extra details have been added for this option yet."}
            </p>
            {listDescription && (
              <div className="mt-4 rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
                <div className="mb-1 font-semibold text-zinc-800">List note</div>
                {listDescription}
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoItem(null)}
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
