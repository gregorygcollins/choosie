export type PlanOptions = {
  participants?: number; // number of participants (2-6)
  tail?: number[]; // deprecated - kept for backwards compatibility
  minReductionFraction?: number; // avoid tiny reductions in early rounds
};

// Role names for each phase based on participant count
const PHASE_ROLES: Record<number, string[]> = {
  6: ["Programmer", "Sorter", "Curator", "Selector", "Decider"],
  5: ["Programmer", "Curator", "Selector", "Decider"],
  4: ["Programmer", "Selector", "Decider"],
  3: ["Programmer", "Decider"],
  2: ["Decider"],
};

// Master target sequence (after Organizer's initial list)
const MASTER_TARGETS = [10, 7, 5, 3, 1];

export function computeNarrowingPlan(
  listLength: number,
  numPlayers: number,
  opts?: PlanOptions
): number[] {
  const participants = opts?.participants ?? numPlayers;
  
  if (listLength <= 1) return [1];

  // Number of narrowing phases = participants - 1 (Organizer doesn't narrow)
  const phaseCount = Math.max(1, participants - 1);

  // Get the rightmost N targets from master sequence
  const idealTargets = MASTER_TARGETS.slice(-phaseCount);

  // Build adaptive plan based on current list size
  const plan: number[] = [];
  let currentSize = listLength;

  for (const target of idealTargets) {
    if (currentSize <= 1) break;

    if (currentSize > target) {
      // We can hit the target
      plan.push(target);
      currentSize = target;
    } else {
      // List is smaller than target, reduce by 1 to catch up
      const nextSize = Math.max(1, currentSize - 1);
      plan.push(nextSize);
      currentSize = nextSize;
    }
  }

  // Ensure we always end with 1
  if (plan.length === 0 || plan[plan.length - 1] !== 1) {
    plan.push(1);
  }

  return plan;
}

export function getRoleName(
  participants: number,
  roundIndex: number
): { role: string; emoji: string } {
  const roles = PHASE_ROLES[participants] || PHASE_ROLES[2];
  const role = roles[roundIndex] || "Narrower";

  const emojiMap: Record<string, string> = {
    Programmer: "💻",
    Sorter: "📊",
    Curator: "🎨",
    Selector: "🎯",
    Decider: "🏆",
  };

  return {
    role,
    emoji: emojiMap[role] || "✨",
  };
}

export default {
  computeNarrowingPlan,
  getRoleName,
};
