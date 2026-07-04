import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db/client";

export async function GET() {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);

    return NextResponse.json({
      app: "ok",
      database: "ok",
    });
  } catch (error) {
    return NextResponse.json(
      {
        app: "ok",
        database: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
