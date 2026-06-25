import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { isAuthenticated } from "@/lib/auth";

function parseId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const oid = parseId(id);
  if (!oid) return Response.json({ error: "Not found" }, { status: 404 });

  const db = await getDb();
  const team = await db.collection("teams").findOne({ _id: oid });
  if (!team) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ ...team, _id: String(team._id) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const oid = parseId(id);
  if (!oid) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = String(body.name);
  if (body.shortName !== undefined)
    update.shortName = String(body.shortName).toUpperCase().slice(0, 4);
  if (body.logoUrl !== undefined) update.logoUrl = body.logoUrl;
  if (body.colors !== undefined) update.colors = body.colors;
  if (body.kit !== undefined) update.kit = body.kit;
  if (body.roster !== undefined) update.roster = body.roster;
  if (body.coach !== undefined) update.coach = body.coach;

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db
    .collection("teams")
    .updateOne({ _id: oid }, { $set: update });

  if (result.matchedCount === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
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
  // Prevent deletion if team is assigned to any match
  const matchCount = await db.collection("matches").countDocuments({
    $or: [{ homeTeamId: id }, { awayTeamId: id }],
  });

  if (matchCount > 0) {
    return Response.json(
      {
        error:
          "No se puede eliminar: el equipo está asignado a uno o más partidos.",
      },
      { status: 409 }
    );
  }

  await db.collection("teams").deleteOne({ _id: oid });
  return Response.json({ ok: true });
}

export const dynamic = "force-dynamic";
