import Pusher from "pusher";

export {
  matchChannelName,
  MATCH_STATE_EVENT,
  PLAYER_EVENT_EVENT,
  type PlayerEvent,
} from "./pusher-shared";

let instance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (instance) return instance;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER, PUSHER_HOST, PUSHER_PORT } =
    process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
    throw new Error("Missing Pusher environment variables");
  }

  // PUSHER_HOST means we're talking to a self-hosted Pusher-protocol server
  // (soketi, via docker-compose) instead of Pusher Cloud.
  if (PUSHER_HOST) {
    instance = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      host: PUSHER_HOST,
      port: PUSHER_PORT || "6001",
      useTLS: false,
    });
    return instance;
  }

  if (!PUSHER_CLUSTER) {
    throw new Error("Missing PUSHER_CLUSTER (or set PUSHER_HOST for a self-hosted server)");
  }

  instance = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return instance;
}
