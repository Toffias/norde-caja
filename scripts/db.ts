// Conexión para los scripts de consola (fuera de Next.js).
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../src/db/schema";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 2,
  timezone: "Z",
  decimalNumbers: true,
});
export const db = drizzle(pool, { schema, mode: "default" });
