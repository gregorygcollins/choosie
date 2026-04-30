// Pure TypeScript narrowing engine (no React, no storage, no Prisma)

export interface NarrowingState {
  items: Array<{ id: string; name: string }>;
  plan: number[];
  round: number;
  selections: string[][]; // selections[round] = array of selected item ids
  winnerId?: string;
}

export function initializeNarrowing(items: Array<{ id: string; name: string }>, plan: number[]): NarrowingState {
  return {
    items,
    plan,
    round: 0,
    selections: [],
    winnerId: undefined,
  };
}

export function getCurrentRound(state: NarrowingState) {
  return state.round;
}

export function validateSelectionCount(selectedIds: string[], target: number) {
  return selectedIds.length === target;
}

export function submitSelections(state: NarrowingState, selectedIds: string[]): NarrowingState {
  const nextRound = state.round + 1;
  const newSelections = [...state.selections];
  newSelections[state.round] = selectedIds;
  let winnerId = undefined;
  if (nextRound >= state.plan.length) {
    // Last round, winner is the only remaining item
    winnerId = selectedIds[0];
  }
  return {
    ...state,
    round: nextRound,
    selections: newSelections,
    winnerId,
  };
}

export function detectWinner(state: NarrowingState): string | undefined {
  return state.winnerId;
}
