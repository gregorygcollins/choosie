import React from "react";
import { getRoleName } from "@/lib/planner";

type NarrowingItem = {
  id: string;
  name: string;
  notes?: string | null;
  image?: string | null;
};

type NarrowingPanelProps = {
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
  onConfirm: () => void;
};

export const NarrowingPanel: React.FC<NarrowingPanelProps> = ({
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
  onConfirm,
}) => {
  const role = getRoleName(participantCount + 1, roundIndex);
  const activeParticipantIndex = roundIndex % Math.max(1, participantCount);
  const isVirtualWaiting = mode === "virtual" && participantIndex !== activeParticipantIndex && !winnerId;
  const winner = winnerId ? items.find((item) => item.id === winnerId) : null;
  const canConfirm = !busy && !isVirtualWaiting && selectedIds.length === target;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {mode === "in-person" ? "In Person Narrowing" : "Virtual Narrowing"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
                {winner ? "Final Choice" : `${role.emoji} ${role.role}'s turn`}
              </h1>
            </div>
            <div className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
              Round {Math.min(roundIndex + 1, plan.length)} of {plan.length}
            </div>
          </div>
          {!winner && (
            <p className="mt-3 text-sm text-zinc-600">
              {isVirtualWaiting
                ? `Waiting for ${role.role} to choose ${target}.`
                : `Choose ${target} ${target === 1 ? "option" : "options"} to keep moving.`}
            </p>
          )}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    disabled={busy || isVirtualWaiting}
                    className={`flex min-h-20 items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      checked
                        ? "border-brand bg-brand/10"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="h-14 w-14 rounded-md object-cover" />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-md bg-zinc-100" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-zinc-950">{item.name}</span>
                      {item.notes && (
                        <span className="mt-1 block line-clamp-2 text-xs text-zinc-500">{item.notes}</span>
                      )}
                    </span>
                  </button>
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
      </section>
    </main>
  );
};
