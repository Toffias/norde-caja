import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function crearPool(): mysql.Pool {
  const nuevo = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 5,
    timezone: "Z",
    decimalNumbers: true,
  });
  // Drizzle escribe y lee TIMESTAMP como texto UTC, así que la sesión de MySQL (defaultNow()) también tiene que estar en UTC.
  nuevo.pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+00:00'", (err) => {
      if (err) console.error("No se pudo fijar la zona horaria de la conexión:", err);
    });
  });
  return nuevo;
}

// Un único pool por proceso (en desarrollo el hot reload reimporta este módulo).
const pool = globalForDb.pool ?? crearPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
