import type { Clock } from "@/models/MatchState";

export interface ClockDisplay {
  /** Main/regulation time — freezes at the regulation boundary once overtime starts. */
  primarySeconds: number;
  /** Extra time elapsed past regulation. 0 while not in overtime. */
  overtimeSeconds: number;
  /** True once regulation time is exhausted and we're past it. */
  inOvertime: boolean;
  /** True once a *fixed* overtime allowance has also run out. */
  overtimeExpired: boolean;
}

// Pure presentation mapping: elapsed seconds since the clock's anchor (as
// computed by useMatchClock, drift-corrected) -> what to actually show.
// This is the only place direction/duration/overtime are interpreted —
// the anchor math itself (start/pause/sync, rehydration) stays in elapsed
// seconds regardless of direction, so none of that needs to change.
//
// The main clock always freezes at the regulation boundary once time is up
// (it never counts into overtime itself) — overtime is tracked as a
// separate counter, shown as its own element (see MainBug's extension bar).
export function deriveClockDisplay(elapsedSeconds: number, clock: Clock): ClockDisplay {
  const duration = clock.durationSeconds;

  if (duration === null) {
    return { primarySeconds: elapsedSeconds, overtimeSeconds: 0, inOvertime: false, overtimeExpired: false };
  }

  const regulationRemaining = duration - elapsedSeconds;
  if (regulationRemaining > 0) {
    const primarySeconds = clock.direction === "down" ? regulationRemaining : elapsedSeconds;
    return { primarySeconds, overtimeSeconds: 0, inOvertime: false, overtimeExpired: false };
  }

  // Regulation time is up: freeze the main clock at the boundary.
  const frozenPrimary = clock.direction === "down" ? 0 : duration;

  if (clock.overtime.mode === "off") {
    return { primarySeconds: frozenPrimary, overtimeSeconds: 0, inOvertime: false, overtimeExpired: false };
  }

  const rawOvertime = elapsedSeconds - duration;
  const allowance = clock.overtime.allowanceSeconds;
  const overtimeExpired = clock.overtime.mode === "fixed" && rawOvertime >= allowance;
  const overtimeSeconds = clock.overtime.mode === "fixed" ? Math.min(rawOvertime, allowance) : rawOvertime;

  return { primarySeconds: frozenPrimary, overtimeSeconds, inOvertime: true, overtimeExpired };
}
