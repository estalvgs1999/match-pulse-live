import { getDb } from "@/lib/mongodb";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  const db = await getDb();
  // Exclude player portraits from list — they're large base64 blobs only
  // needed in the full editor. Still include roster for player count.
  const teams = await db
    .collection("teams")
    .find({}, { projection: { "roster.portraitUrl": 0 } })
    .sort({ name: 1 })
    .toArray();

  return Response.json({
    teams: teams.map((t) => ({ ...t, _id: String(t._id) })),
  });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const primaryColor: string = body.primaryColor ?? "#a78bfa";

  const teamDoc = {
    name: String(body.name),
    shortName: String(body.shortName || body.name).toUpperCase().slice(0, 4),
    slug: toSlug(String(body.name)),
    logoUrl: body.logoUrl ?? "",
    colors: {
      primary: primaryColor,
      secondary: "#ffffff",
      accent: primaryColor,
    },
    kit: {
      style: "solid" as const,
      jerseyColor: primaryColor,
      numberColor: "#000000",
    },
    roster: [],
    coach: body.coach ?? "",
  };

  const db = await getDb();
  const { insertedId } = await db.collection("teams").insertOne(teamDoc);

  return Response.json({ _id: insertedId.toString() }, { status: 201 });
}

export const dynamic = "force-dynamic";
