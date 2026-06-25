"use client";

import PusherClient from "pusher-js";

let client: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (client) return client;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_PUSHER_KEY");

  // NEXT_PUBLIC_PUSHER_HOST means we're talking to a self-hosted
  // Pusher-protocol server (soketi, via docker-compose) instead of Pusher
  // Cloud. Note this is the host the *browser* reaches it at (e.g.
  // "localhost"), which can differ from the Docker-internal hostname the
  // Next.js server uses (see lib/pusher-server.ts).
  const wsHost = process.env.NEXT_PUBLIC_PUSHER_HOST;
  if (wsHost) {
    const wsPort = Number(process.env.NEXT_PUBLIC_PUSHER_PORT ?? "6001");
    client = new PusherClient(key, {
      wsHost,
      wsPort,
      forceTLS: false,
      enabledTransports: ["ws", "wss"],
      cluster: "mt1", // unused with wsHost set, but required by the type
    });
    return client;
  }

  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!cluster) throw new Error("Missing NEXT_PUBLIC_PUSHER_CLUSTER");
  client = new PusherClient(key, { cluster });
  return client;
}

export {
  matchChannelName,
  MATCH_STATE_EVENT,
  PLAYER_EVENT_EVENT,
  type PlayerEvent,
} from "./pusher-shared";
