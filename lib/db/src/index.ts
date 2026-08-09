import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

/** True when the API has enough configuration to open PostgreSQL. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * Lazily opens the connection pool. Importing @workspace/db never throws, so
 * the static UI and /health endpoint can run while PostgreSQL is offline.
 */
export function getPool(): pg.Pool {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not configured. Copy .env.example to .env and set the PostgreSQL connection string.",
    );
  }

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30_000),
      connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS ?? 5_000),
      ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
  }

  return poolInstance;
}

/** Returns the typed Drizzle client backed by the lazy pool. */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) dbInstance = drizzle(getPool(), { schema });
  return dbInstance;
}

/** Close the pool during tests or graceful shutdown. */
export async function closeDatabase(): Promise<void> {
  if (poolInstance) await poolInstance.end();
  poolInstance = null;
  dbInstance = null;
}

export * from "./schema";
