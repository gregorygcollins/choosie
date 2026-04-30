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
    <div>
      <h3>{step.title || "Select Items"}</h3>
      <ul>
        {step.items.map((item: any) => (
          <li key={item.id}>
            <label>
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
              />
              {item.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
