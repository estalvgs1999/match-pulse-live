"use client";

import { useCallback, useEffect, useState } from "react";
import { getPusherClient, matchChannelName, MATCH_STATE_EVENT } from "@/lib/pusher-client";
import type { MatchState, MatchStatePatch } from "@/models/MatchState";

export interface UseMatchState {
  state: MatchState | null;
  /** PATCH a partial update to the match; used by the control panel. */
  patch: (update: MatchStatePatch) => Promise<MatchState>;
}

// Shared by both /overlay and /control: hydrate the current state over REST
// on mount (this is what makes an OBS browser-source reload indistinguishable
// from a first load), then keep it live via Pusher deltas.
export function useMatchState(matchId: string): UseMatchState {
  const [state, setState] = useState<MatchState | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/matches/${matchId}/state`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: MatchState) => {
        if (!cancelled) setState(data);
      })
      .catch(() => {});

    const pusher = getPusherClient();
    const channelName = matchChannelName(matchId);
    const channel = pusher.subscribe(channelName);
    const onState = (data: MatchState) => setState(data);
    channel.bind(MATCH_STATE_EVENT, onState);

    return () => {
      cancelled = true;
      channel.unbind(MATCH_STATE_EVENT, onState);
      pusher.unsubscribe(channelName);
    };
  }, [matchId]);

  const patch = useCallback(
    async (update: MatchStatePatch): Promise<MatchState> => {
      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error(`Failed to update match state (${res.status})`);
      const data = (await res.json()) as MatchState;
      setState(data);
      return data;
    },
    [matchId]
  );

  return { state, patch };
}
