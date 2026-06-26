import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { isAuthenticated } from "@/lib/auth";

function parseId(id: string): ObjectId | null {
  try { return new ObjectId(id); } catch { return null; }
}

// Static match/team info (names, logos, colors, roster) — rarely changes,
// fetched once. Distinct from /state, which is the live, Pusher-driven doc.
// Falls back to embedded team snapshots when the team document has been deleted.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const oid = parseId(id);
  if (!oid) return Response.json({ error: "Not found" }, { status: 404 });

  const db = await getDb();

  const match = await db.collection("matches").findOne({ _id: oid });
  if (!match) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  const teamIds: ObjectId[] = [];
  try { teamIds.push(new ObjectId(match.homeTeamId)); } catch { /* deleted */ }
  try { teamIds.push(new ObjectId(match.awayTeamId)); } catch { /* deleted */ }

  const teams = teamIds.length
    ? await db.collection("teams").find({ _id: { $in: teamIds } }).toArray()
    : [];

  const homeTeam =
    teams.find((t) => String(t._id) === match.homeTeamId) ??
    match.homeTeamSnapshot ??
    null;
  const awayTeam =
    teams.find((t) => String(t._id) === match.awayTeamId) ??
    match.awayTeamSnapshot ??
    null;

  return Response.json({
    match: { ...match, _id: String(match._id) },
    homeTeam: homeTeam && "_id" in homeTeam ? { ...homeTeam, _id: String(homeTeam._id) } : homeTeam,
    awayTeam: awayTeam && "_id" in awayTeam ? { ...awayTeam, _id: String(awayTeam._id) } : awayTeam,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const oid = parseId(id);
  if (!oid) return Response.json({ error: "Not found" }, { status: 404 });

  const db = await getDb();
  const result = await db.collection("matches").deleteOne({ _id: oid });
  if (result.deletedCount === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db.collection("matchStates").deleteOne({ matchId: id });

  return Response.json({ ok: true });
}

export const dynamic = "force-dynamic";
