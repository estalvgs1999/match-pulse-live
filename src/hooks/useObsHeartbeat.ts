"use client";

import { useEffect } from "react";

const PING_INTERVAL_MS = 15_000;

// Used in the overlay page — fires a heartbeat to /api/matches/[id]/obs-ping
// on mount and every 15 s so the control panel can show connection status.
export function useObsHeartbeat(matchId: string) {
  useEffect(() => {
    function ping() {
      fetch(`/api/matches/${matchId}/obs-ping`, { method: "POST" }).catch(() => {});
    }
    ping();
    const id = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [matchId]);
}
