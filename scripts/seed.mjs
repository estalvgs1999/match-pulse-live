// Usage: node --env-file=.env.local scripts/seed.mjs
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "matchpulse";

if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}

const homeTeam = {
  name: "Titan FC",
  shortName: "TIT",
  slug: "titan-fc",
  logoUrl: "",
  colors: { primary: "#134024", secondary: "#ffffff", accent: "#67f58b" },
  kit: { style: "solid", jerseyColor: "#134024", numberColor: "#ffffff" },
  roster: [
    { number: 1, name: "K. NAVAS", position: "Portero" },
    { number: 4, name: "M. SILVA", position: "Defensa" },
    { number: 7, name: "E. ALFARO", position: "Pivot" },
    { number: 10, name: "J. ROJAS", position: "Ala" },
    { number: 11, name: "D. PEREZ", position: "Ala" },
  ],
  coach: "J. DOS SANTOS",
};

const awayTeam = {
  name: "Shadow United",
  shortName: "SHU",
  slug: "shadow-united",
  logoUrl: "",
  colors: { primary: "#18181a", secondary: "#34d399", accent: "#34d399" },
  kit: { style: "striped-vertical", jerseyColor: "#18181a", numberColor: "#34d399" },
  roster: [
    { number: 1, name: "A. TORRES", position: "Portero" },
    { number: 3, name: "L. MENDEZ", position: "Defensa" },
    { number: 8, name: "R. CASTRO", position: "Pivot" },
    { number: 9, name: "F. VARGAS", position: "Ala" },
    { number: 14, name: "S. RUIZ", position: "Ala" },
  ],
  coach: "P. ALONSO",
};

const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db(dbName);

  await db.collection("teams").deleteMany({ slug: { $in: [homeTeam.slug, awayTeam.slug] } });

  const { insertedId: homeTeamId } = await db.collection("teams").insertOne(homeTeam);
  const { insertedId: awayTeamId } = await db.collection("teams").insertOne(awayTeam);

  const match = {
    homeTeamId: homeTeamId.toString(),
    awayTeamId: awayTeamId.toString(),
    tournament: "Torneo de Copa 2026",
    matchday: "Jornada 7 - Fase de Grupos",
    stadium: "Gimnasio San Sebastian",
    date: new Date().toISOString(),
  };

  const { insertedId: matchId } = await db.collection("matches").insertOne(match);

  console.log("Seed complete.");
  console.log(`Match ID: ${matchId.toString()}`);
  console.log(`Overlay:  http://localhost:3000/overlay/${matchId}`);
  console.log(`Control:  http://localhost:3000/control/${matchId}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
