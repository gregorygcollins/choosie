import React from "react";

interface NarrowingPanelProps {
  items: Array<{ id: string; name: string }>;
  state: any;
  selectedIds: string[];
  onToggleItem: (id: string) => void;
  onConfirm: () => void;
  mode: "in-person" | "virtual";
}

export const NarrowingPanel: React.FC<NarrowingPanelProps> = ({
  items,
  state,
  selectedIds,
  onToggleItem,
  onConfirm,
  mode,
}) => {
  const round = state.round + 1;
  const target = state.plan[state.round] || 1;
  const winnerId = state.winnerId;
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow p-6 mt-8">
      <h2 className="text-2xl font-bold mb-2 text-center">{mode === "in-person" ? "Narrow In Person" : "Narrow Virtually"}</h2>
      <div className="text-center mb-4">Round {round} / {state.plan.length}</div>
      {winnerId ? (
        <div className="text-center">
          <div className="text-3xl mb-2">🎉 Winner!</div>
          <div className="text-xl font-bold mb-2">{items.find(i => i.id === winnerId)?.name || "Winner"}</div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-center">Choose {target}</div>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {items.map(item => (
              <label key={item.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${selectedIds.includes(item.id) ? "border-blue-600 bg-blue-50" : "border-zinc-200"}`}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => onToggleItem(item.id)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                  disabled={winnerId !== undefined}
                />
                <span className="text-base font-medium text-zinc-800">{item.name}</span>
              </label>
            ))}
          </div>
          <button
            className="w-full rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:opacity-90 transition-colors disabled:opacity-60"
            disabled={selectedIds.length !== target}
            onClick={onConfirm}
          >
            Confirm ({selectedIds.length}/{target})
          </button>
        </>
      )}
    </div>
  );
};
