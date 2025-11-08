export type PlanOptions = {
  tail?: number[]; // desired final-stage targets, e.g., [5,3,1]
  minReductionFraction?: number; // avoid tiny reductions in early rounds
};

export function computeNarrowingPlan(listLength: number, numPlayers: number, opts?: PlanOptions): number[] {
  const tail = opts?.tail ?? [5, 3, 1];
  const minReductionFraction = opts?.minReductionFraction ?? 0.2;

  if (listLength <= 1) return [1];

  // Always use [5, 3, 1] if list has 5+ items
  if (listLength >= 5) {
    // Return the full tail [5, 3, 1] - already ends with 1
    return tail;
  }

  // If list small, just go to final quickly
  return [1];
}

export default {
  computeNarrowingPlan,
};
