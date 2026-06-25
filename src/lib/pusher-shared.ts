export function matchChannelName(matchId: string): string {
  return `match-${matchId}`;
}

export const MATCH_STATE_EVENT = "state-updated";

// Transient lower-third chip trigger (goal / red card / yellow card).
// Deliberately NOT persisted in MatchState — it's a one-off ~7s animation,
// not something that needs to survive an overlay reload/rehydration.
export const PLAYER_EVENT_EVENT = "player-event";

export interface PlayerEvent {
  type: "goal" | "redCard" | "yellowCard";
  side: "home" | "away";
  number: number;
  name: string;
}
