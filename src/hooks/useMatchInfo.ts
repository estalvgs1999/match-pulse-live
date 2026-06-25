"use client";

import { useEffect, useState } from "react";
import type { Match } from "@/models/Match";
import type { Team } from "@/models/Team";

export interface MatchInfo {
  match: Match;
  homeTeam: Team | null;
  awayTeam: Team | null;
}

// Static match/team data (names, logos, colors, roster) — fetched once.
// The live score/clock/etc. comes from useMatchState instead.
export function useMatchInfo(matchId: string): MatchInfo | null {
  const [info, setInfo] = useState<MatchInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/matches/${matchId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: MatchInfo) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return info;
}
