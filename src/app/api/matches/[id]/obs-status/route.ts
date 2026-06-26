import { getDb } from "@/lib/mongodb";

const CONNECTED_THRESHOLD_MS = 25_000; // must ping within 25 s to be "connected"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const doc = await db.collection("obsPresence").findOne({ matchId: id });
  const lastSeen: number | null = doc?.lastSeen ?? null;
  const connected = lastSeen !== null && Date.now() - lastSeen < CONNECTED_THRESHOLD_MS;
  return Response.json({ connected, lastSeen });
}

export const dynamic = "force-dynamic";
