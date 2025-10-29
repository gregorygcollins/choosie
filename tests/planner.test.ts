import { describe, it, expect } from 'vitest';
import { computeNarrowingPlan } from '../lib/planner';

describe('computeNarrowingPlan', () => {
  it('handles tiny lists by going straight to 1', () => {
    expect(computeNarrowingPlan(1, 2)).toEqual([1]);
    expect(computeNarrowingPlan(3, 3)).toEqual([1]);
    expect(computeNarrowingPlan(4, 4)).toEqual([1]);
  });

  it('matches tail for 50 items with 4 players (rounds=3)', () => {
    const plan = computeNarrowingPlan(50, 4, { tail: [5,3,1] });
    expect(plan).toEqual([5,3,1]);
  });

  it('includes geometric early round for 50 items with 5 players (rounds=4)', () => {
    const plan = computeNarrowingPlan(50, 5, { tail: [5,3,1] });
    expect(plan.length).toBe(4);
    // last 3 should equal the tail
    expect(plan.slice(-3)).toEqual([5,3,1]);
    // first step should be > tail[0]
    expect(plan[0]).toBeGreaterThan(5);
    // strictly descending
    for (let i = 1; i < plan.length; i++) expect(plan[i-1]).toBeGreaterThan(plan[i]);
  });

  it('never exceeds list length and always ends at 1', () => {
    const plan = computeNarrowingPlan(120, 6, { tail: [5,3,1] });
    expect(plan[0]).toBeLessThanOrEqual(120);
    expect(plan[plan.length - 1]).toBe(1);
    for (let i = 1; i < plan.length; i++) expect(plan[i-1]).toBeGreaterThan(plan[i]);
  });

  it('respects smaller tail when players fewer than tail length', () => {
    const plan = computeNarrowingPlan(50, 3, { tail: [5,3,1] });
    // rounds = 2 -> last 2 of tail
    expect(plan).toEqual([3,1]);
  });
});
