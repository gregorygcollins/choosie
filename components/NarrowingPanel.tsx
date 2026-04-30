import React, { useState } from "react";
import { getRoleName } from "@/lib/planner";

type NarrowingItem = {
  id: string;
  name: string;
  notes?: string | null;
  image?: string | null;
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
  busy?: boolean;
  error?: string | null;
  onToggleItem: (id: string) => void;
  onReorderItems: (from: number, to: number) => void;
  onConfirm: () => void;
  onUndo: () => void;
  onReset: () => void;
  onReturnToList: () => void;
};

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
  busy = false,
  error,
  onToggleItem,
  onReorderItems,
  onConfirm,
  onUndo,
  onReset,
  onReturnToList,
}) => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [infoItem, setInfoItem] = useState<NarrowingItem | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const role = getRoleName(participantCount + 1, roundIndex);
  const activeParticipantIndex = roundIndex % Math.max(1, participantCount);
  const isVirtualWaiting = mode === "virtual" && participantIndex !== activeParticipantIndex && !winnerId;
  const winner = winnerId ? items.find((item) => item.id === winnerId) : null;
  const canConfirm = !busy && !isVirtualWaiting && selectedIds.length === target;
  const previousParticipantIndex = Math.max(0, roundIndex - 1) % Math.max(1, participantCount);
  const canUndo =
    !busy &&
    roundIndex > 0 &&
    (mode === "in-person" || participantIndex === previousParticipantIndex);
  const itemGridClass = view === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
  const actionText = role.role === "Decider" ? "Choosie your movie" : `Choosie ${target} movies`;

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-500">
                {listTitle}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {mode === "in-person" ? "In Person Narrowing" : "Virtual Narrowing"}
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-zinc-950">
                {winner ? "Final Choice" : actionText}
              </h1>
              {!winner && (
                <p className="mt-1 text-sm text-zinc-500">
                  {role.emoji} {role.role}'s turn
                </p>
              )}
            </div>
            <div className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
              Round {Math.min(roundIndex + 1, plan.length)} of {plan.length}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {!winner && (
              <p className="text-sm text-zinc-600">
                {isVirtualWaiting
                  ? `Waiting for ${role.role} to choose ${target}.`
                  : "Drag to reorder options, then choose what stays."}
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
                    view === "grid" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
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
                    view === "list" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <ListIcon />
                </button>
              </div>
            )}
          </div>
        </div>

        {winner ? (
          <div className="px-5 py-10 text-center sm:px-6">
            {winner?.image && (
              <img
                src={winner.image}
                alt=""
                className="mx-auto mb-5 h-32 w-32 rounded-lg object-cover"
              />
            )}
            <div className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Winner</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-950">{winner?.name || "Winner"}</div>
          </div>
        ) : (
          <div className="px-5 py-5 sm:px-6">
            <div className={`grid gap-3 ${itemGridClass}`}>
              {items.map((item, index) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    draggable={!busy && !isVirtualWaiting}
                    onDragStart={(event) => onDragStart(event, index)}
                    onDragOver={onDragOver}
                    onDrop={(event) => onDrop(event, index)}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex min-h-20 items-center gap-3 rounded-lg border p-3 transition-colors ${
                      checked
                        ? "border-brand bg-brand/10"
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
                      className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                      ) : (
                        <div className="h-14 w-14 shrink-0 rounded-md bg-zinc-100" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-zinc-950">{item.name}</span>
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

            {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-zinc-600">
                Selected {selectedIds.length} of {target}
              </div>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!canConfirm}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {mode === "in-person" && (
            <button
              type="button"
              onClick={onReturnToList}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
            >
              <ReturnIcon />
              Return to list
            </button>
          )}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <UndoIcon />
            Undo
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <ResetIcon />
            Reset list
          </button>
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
                className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
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
