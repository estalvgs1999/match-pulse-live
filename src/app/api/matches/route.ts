import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  const db = await getDb();

  const matches = await db.collection("matches").find({}).sort({ _id: -1 }).toArray();

  if (matches.length === 0) {
    return Response.json({ matches: [] });
  }

  const teamIds = [
    ...new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId])),
  ].map((id) => new ObjectId(id));

  const teams = await db.collection("teams").find({ _id: { $in: teamIds } }).toArray();
  const teamsById = Object.fromEntries(
    teams.map((t) => [String(t._id), { ...t, _id: String(t._id) }])
  );

  const matchIds = matches.map((m) => String(m._id));
  const states = await db
    .collection("matchStates")
    .find(
      { matchId: { $in: matchIds } },
      { projection: { _id: 0, matchId: 1, locked: 1, matchStatus: 1 } }
    )
    .toArray();
  const stateByMatchId = Object.fromEntries(states.map((s) => [s.matchId, s]));

  return Response.json({
    matches: matches.map((m) => {
      const id = String(m._id);
      const s = stateByMatchId[id];
      return {
        ...m,
        _id: id,
        homeTeam: teamsById[m.homeTeamId] ?? null,
        awayTeam: teamsById[m.awayTeamId] ?? null,
        state: s ? { locked: s.locked ?? false, matchStatus: s.matchStatus ?? "pending" } : null,
      };
    }),
  });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const { tournament, matchday, stadium, date, homeTeam: home, awayTeam: away, homeTeamId, awayTeamId, overlayTemplate } = body;

  if (!tournament || !matchday || !stadium || !date) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!homeTeamId && !home?.name) {
    return Response.json({ error: "Missing home team" }, { status: 400 });
  }
  if (!awayTeamId && !away?.name) {
    return Response.json({ error: "Missing away team" }, { status: 400 });
  }

  const db = await getDb();
  const toSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  function buildTeamDoc(t: { name: string; shortName?: string; primaryColor?: string }) {
    const color = t.primaryColor ?? "#ffffff";
    return {
      name: String(t.name),
      shortName: String(t.shortName ?? t.name).toUpperCase().slice(0, 4),
      slug: toSlug(String(t.name)),
      logoUrl: "",
      colors: { primary: color, secondary: "#ffffff", accent: color },
      kit: { style: "solid" as const, jerseyColor: color, numberColor: "#000000" },
      roster: [],
      coach: "",
    };
  }

  let resolvedHomeId: string;
  if (homeTeamId) {
    resolvedHomeId = String(homeTeamId);
  } else {
    const { insertedId } = await db.collection("teams").insertOne(buildTeamDoc(home));
    resolvedHomeId = insertedId.toString();
  }

  let resolvedAwayId: string;
  if (awayTeamId) {
    resolvedAwayId = String(awayTeamId);
  } else {
    const { insertedId } = await db.collection("teams").insertOne(buildTeamDoc(away));
    resolvedAwayId = insertedId.toString();
  }

  const matchDoc = {
    tournament: String(tournament),
    matchday: String(matchday),
    stadium: String(stadium),
    date: String(date),
    homeTeamId: resolvedHomeId,
    awayTeamId: resolvedAwayId,
    overlayTemplate: overlayTemplate === "classic" ? "classic" : overlayTemplate === "champions" ? "champions" : "redesigned",
  };

  const { insertedId: matchId } = await db.collection("matches").insertOne(matchDoc);
  return Response.json({ _id: matchId.toString() }, { status: 201 });
}

export const dynamic = "force-dynamic";
