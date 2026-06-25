import { z } from "zod";

// 0 = empty, 1 = scored, 2 = missed — mirrors the 3-state penalty dot in scores.html
export const PenaltyResultSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);
export type PenaltyResult = z.infer<typeof PenaltyResultSchema>;

export const DEFAULT_CLOCK = {
  status: "paused" as const,
  direction: "up" as const,
  periodStartServerTs: null,
  baseSeconds: 0,
  durationSeconds: null,
  overtime: { mode: "off" as const, allowanceSeconds: 0 },
};

export const ClockSchema = z.object({
  status: z.enum(["running", "paused"]),
  // "up": stopwatch from 0. "down": counts down from durationSeconds. Both
  // share the same underlying elapsed-seconds anchor below — direction only
  // changes how elapsed seconds are *displayed* (see lib/clock-display.ts),
  // so drift-correction and rehydration logic never needs to know about it.
  direction: z.enum(["up", "down"]).default("up"),
  // Absolute server timestamp (ms) the current period started counting from.
  // null while paused. The overlay anchors its rAF clock to this, never to
  // a locally-decremented counter, so Pusher latency cannot cause drift.
  periodStartServerTs: z.number().nullable(),
  baseSeconds: z.number().min(0),
  // Regulation period length in seconds. null = plain stopwatch, no
  // countdown target and no overtime trigger (today's original behavior).
  durationSeconds: z.number().min(0).nullable().default(null),
  overtime: z
    .object({
      // "off": clock freezes at the regulation boundary once reached.
      // "fixed": counts into a capped allowance (e.g. +6:00) past it.
      // "automatic": counts up with no cap until paused.
      mode: z.enum(["off", "fixed", "automatic"]).default("off"),
      allowanceSeconds: z.number().min(0).default(0),
    })
    .default({ mode: "off", allowanceSeconds: 0 }),
});
export type Clock = z.infer<typeof ClockSchema>;

// High-level match lifecycle, distinct from `period` (free-text label like
// "1P") and `clock.status` (running/paused) — this is "where are we in the
// broadcast", driving which overlay/chip shows and giving the operator
// named checkpoints to jump to or restart from.
// "extra_time" / "extra_time_2" are two distinct phases (not one status
// reused with a different `period` label) so the flow UI and the
// periodOffsetMinutes bookkeeping can branch on status directly instead of
// parsing a free-text period string.
export const MatchStatusSchema = z.enum([
  "pending",
  "in_progress",
  "timeout",
  "half_time",
  "full_time",
  "extra_time",
  "extra_time_2",
  "ended",
]);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;
export const MATCH_STATUSES = MatchStatusSchema.options;

// Shared row/match shapes for the Standings overlay — manual entry by the
// operator, not derived from a tournament/results model (out of scope for
// now; see the project plan).
export const StandingsRowSchema = z.object({
  team: z.string(),
  played: z.number().int().min(0).default(0),
  won: z.number().int().min(0).default(0),
  drawn: z.number().int().min(0).default(0),
  lost: z.number().int().min(0).default(0),
  points: z.number().int().min(0).default(0),
});
export type StandingsRow = z.infer<typeof StandingsRowSchema>;

export const BracketMatchupSchema = z.object({
  teamA: z.string(),
  teamB: z.string(),
  scoreA: z.number().int().min(0).nullable().default(null),
  scoreB: z.number().int().min(0).nullable().default(null),
});
export type BracketMatchup = z.infer<typeof BracketMatchupSchema>;

export const BracketRoundSchema = z.object({
  name: z.string(),
  matchups: z.array(BracketMatchupSchema).default([]),
});
export type BracketRound = z.infer<typeof BracketRoundSchema>;

export const TeamStatsSchema = z.object({
  possession: z.number().int().min(0).max(100).default(50),
  corners: z.number().int().min(0).default(0),
  shotsTotal: z.number().int().min(0).default(0),
  shotsOnTarget: z.number().int().min(0).default(0),
});
export type TeamStats = z.infer<typeof TeamStatsSchema>;
const DEFAULT_TEAM_STATS: TeamStats = { possession: 50, corners: 0, shotsTotal: 0, shotsOnTarget: 0 };

export const MatchStateSchema = z.object({
  matchId: z.string(),
  homeScore: z.number().int().min(0).default(0),
  awayScore: z.number().int().min(0).default(0),
  homeFouls: z.number().int().min(0).max(5).default(0),
  awayFouls: z.number().int().min(0).max(5).default(0),
  // min(5), not a fixed length — sudden death keeps appending rounds past
  // the initial 5 when tied. The overlay/control UI always show only the
  // last 5 (see lib/format.ts's visiblePenaltyWindow), but the full history
  // is kept here so the running shootout score stays correct.
  homePenalties: z.array(PenaltyResultSchema).min(5).default([0, 0, 0, 0, 0]),
  awayPenalties: z.array(PenaltyResultSchema).min(5).default([0, 0, 0, 0, 0]),
  homeRedCards: z.number().int().min(0).default(0),
  awayRedCards: z.number().int().min(0).default(0),
  // Tracked for stats, not given the same "peeking out behind the bug"
  // treatment as red cards on the overlay — just the player chip notifies.
  homeYellowCards: z.number().int().min(0).default(0),
  awayYellowCards: z.number().int().min(0).default(0),
  period: z.string().default("1P"),
  // Minutes already played in PRIOR periods, added to the current period's
  // own elapsed time to get the broadcast "match minute" for goal entries
  // (e.g. a 2nd-half goal at elapsed 0:10 with offset 20 -> minute 21). Set
  // at each "new period starts" transition in LiveConsole — see matchMinute().
  periodOffsetMinutes: z.number().int().min(0).default(0),
  clock: ClockSchema.default(DEFAULT_CLOCK),
  gameMode: z.enum(["normal", "penalties"]).default("normal"),
  activeGraphic: z.enum(["bug", "htft", "lineups", "standings", "stats", "none", "prematch"]).default("bug"),
  htftTitle: z.enum(["HALF TIME", "FULL TIME", "PENALTIES"]).default("FULL TIME"),
  matchStatus: MatchStatusSchema.default("pending"),
  // Which side called the current timeout — only meaningful while
  // matchStatus === "timeout". Drives the timeout chip's team color/name.
  timeoutSide: z.enum(["home", "away"]).nullable().default(null),
  // Independent of matchStatus — replay can be flagged during any phase.
  replayActive: z.boolean().default(false),
  scorers: z
    .object({ home: z.string().default(""), away: z.string().default("") })
    .default({ home: "", away: "" }),
  // Two-leg tie support. The totals here are the OTHER leg(s)' score —
  // the overlay adds the current homeScore/awayScore on top to get the
  // displayed aggregate, so this leg's live score is never duplicated
  // into two places that could drift apart.
  aggregateEnabled: z.boolean().default(false),
  aggregateHomeScore: z.number().int().min(0).default(0),
  aggregateAwayScore: z.number().int().min(0).default(0),
  // Starting lineup is a per-MATCH choice (the same roster can start
  // different five players week to week), so it lives here rather than on
  // the Team document. Jersey numbers, not roster indices, since that's
  // already the stable identifier the rest of the app uses (playerEvent,
  // goal scorers) — survives roster reordering.
  homeLineupStarting: z.array(z.number().int().min(0).max(99)).default([]),
  awayLineupStarting: z.array(z.number().int().min(0).max(99)).default([]),
  homeLineupCaptain: z.number().int().min(0).max(99).nullable().default(null),
  awayLineupCaptain: z.number().int().min(0).max(99).nullable().default(null),
  // The highlighted row in the Starting 5 / Bench list — drives both the
  // row highlight and which portrait shows in the spotlight panel. Distinct
  // from captain: any player can be "current" (e.g. about to take a
  // penalty), not just the armband holder.
  homeLineupCurrentPlayer: z.number().int().min(0).max(99).nullable().default(null),
  awayLineupCurrentPlayer: z.number().int().min(0).max(99).nullable().default(null),
  // Which team's lineup the overlay shows — only one at a time, like the
  // timeout chip's side, since the broadcast graphic is a single full-
  // screen takeover, not a split view.
  lineupSide: z.enum(["home", "away"]).default("home"),
  // Standings/Bracket overlay — manually entered by the operator for this
  // match's broadcast, not derived from a tournament model.
  standingsFormat: z.enum(["league", "bracket"]).default("league"),
  standingsRows: z.array(StandingsRowSchema).default([]),
  bracketRounds: z.array(BracketRoundSchema).default([]),
  // Stats overlay — goals/fouls/cards are already tracked above and reused
  // here, only the fields with no existing home, so these are the rest.
  homeStats: TeamStatsSchema.default(DEFAULT_TEAM_STATS),
  awayStats: TeamStatsSchema.default(DEFAULT_TEAM_STATS),
  // Set true by "End Match". Once locked, PATCH rejects further mutation
  // (see route.ts) except an explicit unlock (locked:false) — keeps a
  // finished match's record from drifting, and is the seam multi-match
  // management will hang off of later (a locked match is simply done).
  locked: z.boolean().default(false),
  updatedAt: z.number().default(() => Date.now()),
});

export type MatchState = z.infer<typeof MatchStateSchema>;

export function defaultMatchState(matchId: string): MatchState {
  return MatchStateSchema.parse({ matchId });
}

// Partial update accepted by PATCH /api/matches/[id]/state.
// Clock changes go through `clockAction` instead of raw fields so the
// server (not the client) stamps periodStartServerTs.
export const MatchStatePatchSchema = z
  .object({
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
    homeFouls: z.number().int().min(0).max(5),
    awayFouls: z.number().int().min(0).max(5),
    homePenalties: z.array(PenaltyResultSchema).min(5),
    awayPenalties: z.array(PenaltyResultSchema).min(5),
    homeRedCards: z.number().int().min(0),
    awayRedCards: z.number().int().min(0),
    homeYellowCards: z.number().int().min(0),
    awayYellowCards: z.number().int().min(0),
    period: z.string(),
    periodOffsetMinutes: z.number().int().min(0),
    gameMode: z.enum(["normal", "penalties"]),
    activeGraphic: z.enum(["bug", "htft", "lineups", "standings", "stats", "none", "prematch"]),
    htftTitle: z.enum(["HALF TIME", "FULL TIME", "PENALTIES"]),
    matchStatus: MatchStatusSchema,
    timeoutSide: z.enum(["home", "away"]).nullable(),
    replayActive: z.boolean(),
    scorers: z.object({ home: z.string().optional(), away: z.string().optional() }).partial(),
    aggregateEnabled: z.boolean(),
    aggregateHomeScore: z.number().int().min(0),
    aggregateAwayScore: z.number().int().min(0),
    homeLineupStarting: z.array(z.number().int().min(0).max(99)),
    awayLineupStarting: z.array(z.number().int().min(0).max(99)),
    homeLineupCaptain: z.number().int().min(0).max(99).nullable(),
    awayLineupCaptain: z.number().int().min(0).max(99).nullable(),
    homeLineupCurrentPlayer: z.number().int().min(0).max(99).nullable(),
    awayLineupCurrentPlayer: z.number().int().min(0).max(99).nullable(),
    lineupSide: z.enum(["home", "away"]),
    standingsFormat: z.enum(["league", "bracket"]),
    standingsRows: z.array(StandingsRowSchema),
    bracketRounds: z.array(BracketRoundSchema),
    homeStats: TeamStatsSchema,
    awayStats: TeamStatsSchema,
    locked: z.boolean(),
    // "restart" = sync to syncSeconds (default 0) AND start running, in one
    // atomic step — kickoff / extra time both want "reset the clock and go"
    // without a separate sync-then-start round trip.
    clockAction: z.enum(["start", "pause", "sync", "restart"]),
    syncSeconds: z.number().min(0),
    // Configuration, not an action — merged directly into clock, doesn't
    // touch periodStartServerTs/baseSeconds. durationSeconds may be
    // explicitly null (clear it back to plain stopwatch), so its presence
    // is checked with `=== undefined` server-side, not `??`.
    clockConfig: z
      .object({
        direction: z.enum(["up", "down"]),
        durationSeconds: z.number().min(0).nullable(),
        overtimeMode: z.enum(["off", "fixed", "automatic"]),
        overtimeAllowanceSeconds: z.number().min(0),
      })
      .partial(),
    // Triggers the lower-third player chip (goal/red card). Not persisted —
    // see PLAYER_EVENT_EVENT in lib/pusher-shared.ts.
    playerEvent: z.object({
      type: z.enum(["goal", "redCard", "yellowCard"]),
      side: z.enum(["home", "away"]),
      number: z.number().int().min(0).max(99),
      name: z.string().min(1),
    }),
  })
  .partial();

export type MatchStatePatch = z.infer<typeof MatchStatePatchSchema>;
