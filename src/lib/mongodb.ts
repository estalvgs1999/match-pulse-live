import { MongoClient, type Db } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  // Low maxPoolSize: Atlas's real connection ceiling is
  // maxPoolSize x concurrent serverless instances, not maxPoolSize alone.
  const client = new MongoClient(uri, { maxPoolSize: 5 });
  return client.connect();
}

// Cached on `global` so warm serverless invocations (and dev HMR reloads)
// reuse the same connection instead of opening a new one per request.
export async function getDb(): Promise<Db> {
  const dbName = process.env.MONGODB_DB ?? "matchpulse";
  global._mongoClientPromise ??= createClientPromise();
  const client = await global._mongoClientPromise;
  return client.db(dbName);
}
