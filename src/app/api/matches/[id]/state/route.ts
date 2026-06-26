import { getDb } from "@/lib/mongodb";
import {
  getPusherServer,
  matchChannelName,
  MATCH_STATE_EVENT,
  PLAYER_EVENT_EVENT,
} from "@/lib/pusher-server";
import { isAuthenticated } from "@/lib/auth";
import {
  type Clock,
  type MatchState,
  type MatchStatePatch,
  MatchStatePatchSchema,
  MatchStateSchema,
  defaultMatchState,
} from "@/models/MatchState";

const COLLECTION = "matchStates";

async function loadOrCreateState(matchId: string): Promise<MatchState> {
  const db = await getDb();
  const collection = db.collection<MatchState>(COLLECTION);
  const existing = await collection.findOne({ matchId }, { projection: { _id: 0 } });
  if (existing) {
    // Parse (not just cast) so documents written under an older shape of
    // the schema get missing fields filled in with defaults on read,
    // instead of reaching the client incomplete and crashing it.
    return MatchStateSchema.parse(existing);
  }
  const fresh = defaultMatchState(matchId);
  await collection.insertOne({ ...fresh });
  return fresh;
}

// Server-side clock math. The client never sends elapsed time directly —
// only an action — so the anchor timestamp is always trustworthy, which is
// what makes the overlay's drift-corrected clock work (see useMatchClock).
// Direction/duration/overtime config is untouched here — see clockConfig in
// the PATCH handler and lib/clock-display.ts for how it's interpreted.
function applyClockAction(
  clock: Clock,
  action: "start" | "pause" | "sync" | "restart",
  syncSeconds: number | undefined
): Clock {
  const now = Date.now();

  if (action === "start") {
    return { ...clock, status: "running", periodStartServerTs: now };
  }

  if (action === "pause") {
    const elapsed =
      clock.status === "running" && clock.periodStartServerTs !== null
        ? clock.baseSeconds + (now - clock.periodStartServerTs) / 1000
        : clock.baseSeconds;
    return { ...clock, status: "paused", periodStartServerTs: null, baseSeconds: elapsed };
  }

  if (action === "restart") {
    return { ...clock, status: "running", periodStartServerTs: now, baseSeconds: syncSeconds ?? 0 };
  }

  // sync: operator dictates the exact second; keep running/paused status as-is
  const baseSeconds = syncSeconds ?? clock.baseSeconds;
  return {
    ...clock,
    periodStartServerTs: clock.status === "running" ? now : null,
    baseSeconds,
  };
}

function applyClockConfig(
  clock: Clock,
  config: NonNullable<MatchStatePatch["clockConfig"]>
): Clock {
  return {
    ...clock,
    direction: config.direction ?? clock.direction,
    // durationSeconds may be explicitly cleared to null, which `??` would
    // wrongly treat as "not provided" — so check presence explicitly.
    durationSeconds:
      config.durationSeconds === undefined ? clock.durationSeconds : config.durationSeconds,
    overtime: {
      mode: config.overtimeMode ?? clock.overtime.mode,
      allowanceSeconds: config.overtimeAllowanceSeconds ?? clock.overtime.allowanceSeconds,
    },
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = await loadOrCreateState(id);
  return Response.json(state);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = MatchStatePatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const current = await loadOrCreateState(id);

  // A locked (ended) match is immutable — the one escape hatch is an
  // explicit unlock (locked:false) for operator error recovery, which can
  // itself carry other corrections in the same patch. Everything else is
  // rejected outright rather than silently ignored, so the operator sees
  // their tap didn't take effect instead of assuming it did.
  if (current.locked && parsed.data.locked !== false) {
    return Response.json({ error: "Match is locked. Unlock it first to make changes." }, { status: 409 });
  }

  const { clockAction, syncSeconds, scorers, clockConfig, playerEvent, ...rest } = parsed.data;

  let nextClock = clockConfig ? applyClockConfig(current.clock, clockConfig) : current.clock;
  if (clockAction) {
    nextClock = applyClockAction(nextClock, clockAction, syncSeconds);
  }

  // When foul tracking is on and the period transitions to half_time, accumulate
  // period fouls into the totals and reset the period counter. This is the only
  // boundary where period fouls reset — extra time resets are triggered manually.
  const foulReset: Partial<MatchState> = {};
  if (
    rest.matchStatus === "half_time" &&
    (rest.foulTracking ?? current.foulTracking)
  ) {
    foulReset.homeTotalFouls = (current.homeTotalFouls ?? 0) + current.homeFouls;
    foulReset.awayTotalFouls = (current.awayTotalFouls ?? 0) + current.awayFouls;
    foulReset.homeFouls = 0;
    foulReset.awayFouls = 0;
  }

  const next: MatchState = {
    ...current,
    ...rest,
    ...foulReset,
    scorers: { ...current.scorers, ...scorers },
    clock: nextClock,
    updatedAt: Date.now(),
  };

  const db = await getDb();
  await db
    .collection<MatchState>(COLLECTION)
    .updateOne({ matchId: id }, { $set: next }, { upsert: true });

  const pusher = getPusherServer();
  const channel = matchChannelName(id);
  await pusher.trigger(channel, MATCH_STATE_EVENT, next);
  if (playerEvent) {
    await pusher.trigger(channel, PLAYER_EVENT_EVENT, playerEvent);
  }

  return Response.json(next);
}

export const dynamic = "force-dynamic";
