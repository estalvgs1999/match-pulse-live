"use client";

import { useEffect, useRef, useState } from "react";
import type { Clock } from "@/models/MatchState";

// Drift-corrected clock: never decrements a local counter. Anchors to the
// server timestamp the period started at, plus the offset between this
// client's clock and the server's. Because START always carries an absolute
// server timestamp (set server-side, see api/matches/[id]/state PATCH), the
// latency of the Pusher message that delivered it is irrelevant here.
export function useMatchClock(clock: Clock, serverOffsetMs: number): number {
  const [runningSeconds, setRunningSeconds] = useState(clock.baseSeconds);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (clock.status !== "running" || clock.periodStartServerTs === null) {
      return;
    }

    const periodStartServerTs = clock.periodStartServerTs;
    const baseSeconds = clock.baseSeconds;

    const tick = () => {
      const correctedNow = Date.now() + serverOffsetMs;
      const elapsed = (correctedNow - periodStartServerTs) / 1000;
      setRunningSeconds(baseSeconds + elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [clock.status, clock.periodStartServerTs, clock.baseSeconds, serverOffsetMs]);

  // While paused, baseSeconds from the server is already authoritative —
  // no need to round-trip it through state.
  return clock.status === "running" ? runningSeconds : clock.baseSeconds;
}
