// Crea (o actualiza la contraseña de) un usuario ADMIN.
// Uso: ADMIN_USUARIO=... ADMIN_NOMBRE=... ADMIN_PASSWORD=... pnpm crear-admin
// Las variables también se pueden poner en .env.local (nunca se suben al repo).
import bcrypt from "bcryptjs";
import { db, pool } from "./db";
import { usuarios } from "../src/db/schema";

async function main() {
  const usuario = process.env.ADMIN_USUARIO?.trim().toLowerCase();
  const nombre = process.env.ADMIN_NOMBRE?.trim() || "Administrador";
  const password = process.env.ADMIN_PASSWORD;
  if (!usuario || !password || password.length < 8) {
    console.error("Definí ADMIN_USUARIO y ADMIN_PASSWORD (mínimo 8 caracteres).");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(usuarios)
    .values({ usuario, nombre, passwordHash, rol: "ADMIN" })
    .onDuplicateKeyUpdate({ set: { passwordHash, rol: "ADMIN", activo: true } });
  console.log(`Admin "${usuario}" listo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
