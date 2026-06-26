import { getDb } from "@/lib/mongodb";

// Called by the overlay every ~15 s to mark itself as alive.
// Stored in a separate "obsPresence" collection to avoid polluting MatchState
// or triggering Pusher on every heartbeat.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  await db.collection("obsPresence").updateOne(
    { matchId: id },
    { $set: { matchId: id, lastSeen: Date.now() } },
    { upsert: true }
  );
  return Response.json({ ok: true });
}

export const dynamic = "force-dynamic";
