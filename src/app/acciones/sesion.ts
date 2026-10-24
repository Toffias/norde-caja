"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { cerrarSesion, crearSesion } from "@/lib/auth";
import type { EstadoForm } from "@/lib/montos";

// Freno simple contra adivinar contraseñas: 5 intentos fallidos cada 15 minutos.
// La clave es usuario + IP, así nadie puede bloquearle el ingreso a otro a propósito desde su máquina.
const intentos = new Map<string, { cantidad: number; desde: number }>();
const VENTANA_MS = 15 * 60 * 1000;
const MAX_INTENTOS = 5;

/** Borra las entradas con la ventana vencida para que el mapa no crezca sin límite. */
function purgarVencidos(ahora: number) {
  for (const [clave, intento] of intentos) {
    if (ahora - intento.desde >= VENTANA_MS) intentos.delete(clave);
  }
}

async function claveFreno(usuario: string): Promise<string> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
  return `${usuario}|${ip}`;
}

export async function ingresar(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = String(form.get("usuario") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!usuario || !password) return { error: "Completá usuario y contraseña." };

  const ahora = Date.now();
  const clave = await claveFreno(usuario);
  const previo = intentos.get(clave);
  if (previo && ahora - previo.desde < VENTANA_MS && previo.cantidad >= MAX_INTENTOS) {
    return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.usuario, usuario) });
  const valido = !!u && u.activo && (await bcrypt.compare(password, u.passwordHash));
  if (!valido) {
    const base = previo && ahora - previo.desde < VENTANA_MS ? previo : { cantidad: 0, desde: ahora };
    purgarVencidos(ahora);
    intentos.set(clave, { cantidad: base.cantidad + 1, desde: base.desde });
    return { error: "Usuario o contraseña incorrectos." };
  }

  intentos.delete(clave);
  await crearSesion(u.id);
  redirect("/");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/login");
}
