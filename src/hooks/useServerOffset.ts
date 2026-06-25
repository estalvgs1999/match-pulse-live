"use client";

import { useEffect, useState } from "react";

const ROUNDS = 5;

export interface ServerOffset {
  /** ms to add to Date.now() to get the server's wall-clock time */
  offsetMs: number;
  ready: boolean;
}

// NTP-style handshake: several round trips against /api/time, keep the
// sample with the smallest RTT (least queuing/jitter), and derive the offset
// from it. Computed once per mount — this is what lets the overlay clock
// ignore Pusher message latency entirely (see useMatchClock).
export function useServerOffset(): ServerOffset {
  const [offsetMs, setOffsetMs] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function measure() {
      let best: { rtt: number; offset: number } | null = null;

      for (let i = 0; i < ROUNDS; i++) {
        const sendTime = Date.now();
        try {
          const res = await fetch("/api/time", { cache: "no-store" });
          const receiveTime = Date.now();
          const { serverTime } = (await res.json()) as { serverTime: number };
          const rtt = receiveTime - sendTime;
          const offset = serverTime - (sendTime + rtt / 2);
          if (!best || rtt < best.rtt) best = { rtt, offset };
        } catch {
          // network blip mid-handshake; skip this round and try the next
        }
      }

      if (!cancelled && best) {
        setOffsetMs(best.offset);
        setReady(true);
      }
    }

    measure();
    return () => {
      cancelled = true;
    };
  }, []);

  return { offsetMs, ready };
}
