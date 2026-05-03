export type PlanOptions = {
  participants?: number; // total participants, including the Organizer (2-6)
  tail?: number[]; // deprecated - kept for backwards compatibility
  minReductionFraction?: number; // avoid tiny reductions in early rounds
};

export type NarrowingRole = {
  role: string;
  target: number;
};

// Role names for each narrowing phase based on total participant count.
export const PHASE_ROLES: Record<number, string[]> = {
  6: ["Curator", "Editor", "Programmer", "Selector", "Decider"],
  5: ["Editor", "Programmer", "Selector", "Decider"],
  4: ["Programmer", "Selector", "Decider"],
  3: ["Selector", "Decider"],
  2: ["Decider"],
};

// Master target sequence (after Organizer's initial list)
export const MASTER_TARGETS = [10, 7, 5, 3, 1];

export function getNarrowerCount(participants: number) {
  return Math.min(5, Math.max(1, participants - 1));
}

export function getMinimumListSizeForNarrowers(narrowerCount: number) {
  const count = Math.min(5, Math.max(1, narrowerCount));
  if (count === 1) return 1;
  const firstTarget = MASTER_TARGETS.slice(-count)[0];
  return firstTarget + 1;
}

export function getRolePlan(participants: number): NarrowingRole[] {
  const narrowerCount = getNarrowerCount(participants);
  const roles = PHASE_ROLES[narrowerCount + 1] || PHASE_ROLES[2];
  const targets = MASTER_TARGETS.slice(-narrowerCount);

  return roles.map((role, index) => ({
    role,
    target: targets[index] ?? 1,
  }));
}

export function computeNarrowingPlan(
  listLength: number,
  numPlayers: number,
  opts?: PlanOptions
): number[] {
  const participants = opts?.participants ?? numPlayers;
  const narrowerCount = getNarrowerCount(participants);

  const minimumListSize = getMinimumListSizeForNarrowers(narrowerCount);
  if (listLength < minimumListSize) {
    throw new Error(`List must include at least ${minimumListSize} items for ${narrowerCount} narrower${narrowerCount === 1 ? "" : "s"}`);
  }

  if (listLength <= 1) return [1];

  return getRolePlan(participants).map((phase) => phase.target);
}

export function getRoleName(
  participants: number,
  roundIndex: number
): { role: string; emoji: string } {
  const role = getRolePlan(participants)[roundIndex]?.role || "Narrower";

  const emojiMap: Record<string, string> = {
    Curator: "🗂️",
    Editor: "✏️",
    Programmer: "💻",
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
  getMinimumListSizeForNarrowers,
  getNarrowerCount,
  getRolePlan,
  getRoleName,
};
