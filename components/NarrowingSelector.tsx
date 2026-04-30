import React from "react";

interface NarrowingSelectorProps {
  step: any; // NarrowingStep type
  selections: Record<string, string[]>;
  participantId: string;
  onSelect: (itemIds: string[]) => void;
  disabled?: boolean;
}

// Shared selection UI for both In Person and Virtual narrowing
export const NarrowingSelector: React.FC<NarrowingSelectorProps> = ({
  step,
  selections,
  participantId,
  onSelect,
  disabled = false,
}) => {
  // Render selectable items for the current step
  // This is a placeholder UI; replace with your actual selection UI
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 text-center">{step.title || "Select Items"}</h3>
      <ul className="flex flex-col gap-2 mb-4">
        {step.items.map((item: any) => (
          <li key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-blue-50 transition">
            <label className="flex items-center gap-2 w-full cursor-pointer">
              <input
                type="checkbox"
                disabled={disabled}
                checked={selections[participantId]?.includes(item.id) || false}
                onChange={e => {
                  if (e.target.checked) {
                    onSelect([...(selections[participantId] || []), item.id]);
                  } else {
                    onSelect((selections[participantId] || []).filter((id: string) => id !== item.id));
                  }
                }}
                className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-base font-medium text-zinc-800">{item.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
