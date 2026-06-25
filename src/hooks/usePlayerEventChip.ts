"use client";

import { useEffect, useState } from "react";
import {
  getPusherClient,
  matchChannelName,
  PLAYER_EVENT_EVENT,
  type PlayerEvent,
} from "@/lib/pusher-client";

const DISPLAY_MS = 7000;

// Subscribes to the same match channel as useMatchState, but for the
// transient player-event broadcast (goal/red card), not the persisted
// state. Purely a local display timer — nothing here needs to survive an
// overlay reload, so there's no rehydration concern.
export function usePlayerEventChip(matchId: string): PlayerEvent | null {
  const [event, setEvent] = useState<PlayerEvent | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = matchChannelName(matchId);
    // subscribe() is idempotent — useMatchState subscribes to this same
    // channel for state updates and owns the unsubscribe on unmount.
    // Calling unsubscribe() here too would tear down the channel out from
    // under it (Pusher channels aren't ref-counted), so this hook only
    // binds/unbinds its own event and leaves the channel lifecycle alone.
    const channel = pusher.subscribe(channelName);
    let hideTimeout: ReturnType<typeof setTimeout> | undefined;

    const onEvent = (data: PlayerEvent) => {
      setEvent(data);
      if (hideTimeout) clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => setEvent(null), DISPLAY_MS);
    };

    channel.bind(PLAYER_EVENT_EVENT, onEvent);
    return () => {
      channel.unbind(PLAYER_EVENT_EVENT, onEvent);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [matchId]);

  return event;
}
