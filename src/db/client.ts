import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | null = null;
let db: Db | null = null;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  return url;
}

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  if (!db) {
    db = drizzle(pool, { schema });
  }

  return db;
}
