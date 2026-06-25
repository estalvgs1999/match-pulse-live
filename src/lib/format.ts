import type { PenaltyResult } from "@/models/MatchState";

export function formatMatchClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Shootout score — count of converted attempts. Used for the dedicated
// penalties scoreboard (MainBug's score box switches to this in penalty
// mode instead of the match goal count).
export function countMade(results: PenaltyResult[]): number {
  return results.filter((r) => r === 1).length;
}

// The shootout array grows past 5 during sudden death (see
// MatchState.homePenalties), but the broadcast — and the operator's own
// editing grid — always show only the most recent 5 slots, queue-style:
// older decided rounds scroll off as new ones are added.
export function visiblePenaltyWindow(results: PenaltyResult[]): PenaltyResult[] {
  return results.length <= 5 ? results : results.slice(-5);
}
