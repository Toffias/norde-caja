"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { cerrarSesion, crearSesion } from "@/lib/auth";
import type { EstadoForm } from "@/lib/montos";

// Freno simple contra adivinar contraseñas: 5 intentos fallidos por usuario cada 15 minutos.
const intentos = new Map<string, { cantidad: number; desde: number }>();
const VENTANA_MS = 15 * 60 * 1000;

export async function ingresar(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = String(form.get("usuario") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!usuario || !password) return { error: "Completá usuario y contraseña." };

  const ahora = Date.now();
  const previo = intentos.get(usuario);
  if (previo && ahora - previo.desde < VENTANA_MS && previo.cantidad >= 5) {
    return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.usuario, usuario) });
  const valido = !!u && u.activo && (await bcrypt.compare(password, u.passwordHash));
  if (!valido) {
    const base = previo && ahora - previo.desde < VENTANA_MS ? previo : { cantidad: 0, desde: ahora };
    intentos.set(usuario, { cantidad: base.cantidad + 1, desde: base.desde });
    return { error: "Usuario o contraseña incorrectos." };
  }

  intentos.delete(usuario);
  await crearSesion(u.id);
  redirect("/");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/login");
}
