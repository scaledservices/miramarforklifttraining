import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Ensure the database is provisioned.");
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function ensureSequences() {
  try {
    await pool.query("CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;");
    await pool.query("CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;");
  } catch (err) {
    console.error("[DB] Failed to ensure sequences:", err);
  }
}
