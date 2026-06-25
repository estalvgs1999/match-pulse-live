import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// Static match/team info (names, logos, colors, roster) — rarely changes,
// fetched once. Distinct from /state, which is the live, Pusher-driven doc.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();

  const match = await db.collection("matches").findOne({ _id: new ObjectId(id) });
  if (!match) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  const teamIds = [match.homeTeamId, match.awayTeamId].map((teamId: string) => new ObjectId(teamId));
  const teams = await db
    .collection("teams")
    .find({ _id: { $in: teamIds } })
    .toArray();

  const homeTeam = teams.find((team) => String(team._id) === match.homeTeamId) ?? null;
  const awayTeam = teams.find((team) => String(team._id) === match.awayTeamId) ?? null;

  return Response.json({
    match: { ...match, _id: String(match._id) },
    homeTeam: homeTeam ? { ...homeTeam, _id: String(homeTeam._id) } : null,
    awayTeam: awayTeam ? { ...awayTeam, _id: String(awayTeam._id) } : null,
  });
}

export const dynamic = "force-dynamic";
