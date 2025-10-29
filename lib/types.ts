export type ChoosieItem = {
  id: string;
  title: string;
  notes?: string;
  image?: string | null;
};

export type ChoosieList = {
  id: string;
  title: string;
  items: ChoosieItem[];
  createdAt: string;
  winnerId?: string;
  // (Preferences removed in v1 cleanup)
  narrowers?: number;
  narrowingPlan?: number[];
  narrowingTail?: number[];
  minReductionFraction?: number;
  event?: {
    date?: string;
    location?: string;
    invitees?: string[];
    notes?: string;
    visibility?: "private" | "link";
  };
  progress?: {
    remainingIds: string[];
    currentNarrower: number;
    round?: number;
    totalRounds?: number;
    history?: Array<{
      remainingIds: string[];
      currentNarrower: number;
      round: number;
    }>;
  };
};
