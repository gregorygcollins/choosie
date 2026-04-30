// Shared narrowing state machine and helpers for both In Person and Virtual flows
// This module centralizes narrowing state, transitions, and winner calculation logic

import { z } from "zod";

// Minimal type definitions for narrowing state logic
export interface NarrowingStep {
  title?: string;
  items: Array<{ id: string; name: string }>;
}

export interface WinnerResult {
  id: string;
  name: string;
}

// Define the narrowing state shape (can be extended as needed)
export interface SharedNarrowingState {
  steps: NarrowingStep[];
  currentStep: number;
  selections: Record<string, string[]>; // participantId -> selected item ids
  finalized: boolean;
  winner: WinnerResult | null;
  error?: string;
}

// State initialization
export function initNarrowingState(steps: NarrowingStep[]): SharedNarrowingState {
  return {
    steps,
    currentStep: 0,
    selections: {},
    finalized: false,
    winner: null,
  };
}

// Advance to next step
export function advanceStep(state: SharedNarrowingState): SharedNarrowingState {
  if (state.currentStep < state.steps.length - 1) {
    return { ...state, currentStep: state.currentStep + 1 };
  }
  return { ...state, finalized: true };
}

// Record a participant's selection
export function recordSelection(state: SharedNarrowingState, participantId: string, itemIds: string[]): SharedNarrowingState {
  return {
    ...state,
    selections: {
      ...state.selections,
      [participantId]: itemIds,
    },
  };
}

// Check if all participants have selected for the current step
export function allSelected(state: SharedNarrowingState, participantIds: string[]): boolean {
  return participantIds.every(pid => state.selections[pid]?.length > 0);
}

// Calculate winner (stub, replace with real logic)
export function calculateWinner(state: SharedNarrowingState): WinnerResult | null {
  // Implement winner calculation logic here
  return null;
}

// Defensive error handling wrapper
export function withError(state: SharedNarrowingState, error: string): SharedNarrowingState {
  return { ...state, error };
}
