"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ROLES, usuarios, type Rol } from "@/db/schema";
import { requerirAdmin, requerirUsuario } from "@/lib/auth";
import type { EstadoForm } from "@/lib/montos";

const MIN_PASSWORD = 8;

export async function crearUsuario(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  await requerirAdmin();
  const usuario = String(form.get("usuario") ?? "").trim().toLowerCase();
  const nombre = String(form.get("nombre") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rol = String(form.get("rol") ?? "USUARIO") as Rol;

  if (!/^[a-z0-9._-]{3,50}$/.test(usuario)) {
    return { error: "El usuario debe tener entre 3 y 50 caracteres (letras, números, punto, guion)." };
  }
  if (!nombre) return { error: "Escribí el nombre." };
  if (password.length < MIN_PASSWORD) return { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  if (!ROLES.includes(rol)) return { error: "Rol inválido." };

  const existe = await db.query.usuarios.findFirst({ where: eq(usuarios.usuario, usuario) });
  if (existe) return { error: "Ya existe un usuario con ese nombre." };

  await db.insert(usuarios).values({ usuario, nombre, rol, passwordHash: await bcrypt.hash(password, 12) });
  revalidatePath("/usuarios");
  return { ok: `Usuario "${usuario}" creado.` };
}

export async function actualizarUsuario(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const yo = await requerirAdmin();
  const id = Number(form.get("id"));
  const rol = String(form.get("rol") ?? "") as Rol;
  const activo = form.get("activo") === "on";
  const password = String(form.get("password") ?? "");

  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.id, id) });
  if (!u) return { error: "El usuario no existe." };
  if (!ROLES.includes(rol)) return { error: "Rol inválido." };
  if (u.id === yo.id && (rol !== "ADMIN" || !activo)) {
    return { error: "No podés quitarte el rol de admin ni desactivar tu propio usuario." };
  }
  if (password && password.length < MIN_PASSWORD) {
    return { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  }

  await db
    .update(usuarios)
    .set({ rol, activo, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) })
    .where(eq(usuarios.id, id));
  revalidatePath("/usuarios");
  return { ok: `Cambios guardados para "${u.usuario}".` };
}

export async function cambiarMiPassword(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const yo = await requerirUsuario();
  const actual = String(form.get("actual") ?? "");
  const nueva = String(form.get("nueva") ?? "");
  const repetir = String(form.get("repetir") ?? "");

  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.id, yo.id) });
  if (!u || !(await bcrypt.compare(actual, u.passwordHash))) return { error: "La contraseña actual no es correcta." };
  if (nueva.length < MIN_PASSWORD) return { error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  if (nueva !== repetir) return { error: "Las contraseñas nuevas no coinciden." };

  await db.update(usuarios).set({ passwordHash: await bcrypt.hash(nueva, 12) }).where(eq(usuarios.id, yo.id));
  return { ok: "Contraseña actualizada." };
}
