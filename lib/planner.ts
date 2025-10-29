export type PlanOptions = {
  tail?: number[]; // desired final-stage targets, e.g., [5,3,1]
  minReductionFraction?: number; // avoid tiny reductions in early rounds
};

export function computeNarrowingPlan(listLength: number, numPlayers: number, opts?: PlanOptions): number[] {
  const tail = opts?.tail ?? [5, 3, 1];
  const minReductionFraction = opts?.minReductionFraction ?? 0.2;

  if (listLength <= 1) return [1];
  // rounds = number of narrowing turns (assumes owner does not narrow)
  const rounds = Math.max(1, numPlayers - 1);

  // If list small, just go to final quickly
  if (listLength < 5) return [1];

  // If tail already covers the rounds, use the rightmost `rounds` elements
  if (tail.length >= rounds) {
    const chosen = tail.slice(tail.length - rounds).map((t) => Math.min(t, listLength));
    const clean = chosen.reduce((acc: number[], cur) => {
      if (acc.length === 0 || acc[acc.length - 1] > cur) acc.push(cur);
      return acc;
    }, [] as number[]);
    if (clean[clean.length - 1] !== 1) clean.push(1);
    return Array.from(new Set(clean)).map((x) => Math.max(1, x));
  }

  // Reserve tail for last k rounds and compute earlier rounds
  const k = tail.length;
  const earlyRounds = rounds - k;
  const firstTailTarget = Math.min(tail[0], listLength);

  // If there are no early rounds, do geometric split
  if (earlyRounds <= 0) {
    const plan: number[] = [];
    for (let i = 1; i <= rounds; i++) {
      const val = Math.max(1, Math.round(Math.pow(listLength, (rounds - i) / rounds)));
      plan.push(val);
    }
    if (plan[plan.length - 1] !== 1) plan.push(1);
    return Array.from(new Set(plan));
  }

  // compute multiplicative factor f so that after m steps we go from listLength -> firstTailTarget
  const m = earlyRounds;
  const f = Math.pow(firstTailTarget / listLength, 1 / m);
  const early: number[] = [];
  let cur = listLength;
  for (let i = 0; i < m; i++) {
    const next = Math.max(1, Math.round(cur * f));
    if (next >= cur) {
      const forced = Math.max(1, Math.round(cur * (1 - Math.max(minReductionFraction, 0.2))));
      early.push(forced);
      cur = forced;
    } else {
      early.push(next);
      cur = next;
    }
  }

  // Ensure the last early step is strictly greater than the first tail target
  // to avoid collapsing duplicate steps when m === 1 (e.g., 50 -> 5 then [5,3,1]).
  if (m === 1 && early.length === 1 && early[0] <= firstTailTarget) {
    // pick a reasonable buffer between listLength and firstTailTarget
    // aim for ~30% of listLength, but at least tail+1 and strictly less than listLength
    const bumped = Math.max(firstTailTarget + 1, Math.min(listLength - 1, Math.round(listLength * 0.3)));
    early[0] = Math.max(bumped, firstTailTarget + 1);
    cur = early[0];
  }

  const tailClamped = tail.map((t) => Math.max(1, Math.min(t, cur)));
  const combined = [...early, ...tailClamped];
  const cleaned = combined.reduce((acc: number[], n) => {
    if (acc.length === 0 || acc[acc.length - 1] > n) acc.push(n);
    return acc;
  }, [] as number[]);
  if (cleaned[cleaned.length - 1] !== 1) cleaned.push(1);
  return cleaned.map((x) => Math.max(1, x));
}

export default {
  computeNarrowingPlan,
};
