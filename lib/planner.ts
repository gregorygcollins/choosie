export type PlanOptions = {
  tail?: number[]; // desired final-stage targets, e.g., [5,3,1]
  minReductionFraction?: number; // avoid tiny reductions in early rounds
};

export function computeNarrowingPlan(listLength: number, numPlayers: number, opts?: PlanOptions): number[] {
  const tail = opts?.tail ?? [5, 3, 1];
  const minReductionFraction = opts?.minReductionFraction ?? 0.2;

  if (listLength <= 1) return [1];

  // Always use [5, 3, 1] if possible
  if (listLength >= 5) {
    return tail.filter(t => t <= listLength).concat(1);
  }

  // If list small, just go to final quickly
  return [1];
}

export default {
  computeNarrowingPlan,
};
