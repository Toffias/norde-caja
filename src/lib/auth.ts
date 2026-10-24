import "server-only";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { usuarios, type Rol } from "@/db/schema";

export const COOKIE_SESION = "caja_sesion";
const DURACION_SEG = 60 * 60 * 12;

function clave(): Uint8Array {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres) en las variables de entorno.");
  }
  return new TextEncoder().encode(secreto);
}

export async function crearSesion(usuarioId: number): Promise<void> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(usuarioId))
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SEG}s`)
    .sign(clave());
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEG,
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE_SESION);
}

export type UsuarioSesion = { id: number; usuario: string; nombre: string; rol: Rol };

/**
 * Usuario logueado, o null. Se relee de la base en cada pedido para que un cambio de rol
 * o una baja tengan efecto inmediato.
 */
export const usuarioActual = cache(async (): Promise<UsuarioSesion | null> => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  let id: number;
  let emitido: number;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    id = Number(payload.sub);
    emitido = Number(payload.iat ?? 0);
  } catch {
    return null;
  }
  const u = await db.query.usuarios.findFirst({ where: eq(usuarios.id, id) });
  if (!u || !u.activo) return null;
  // Sesión emitida antes del último cambio de contraseña (un segundo de margen porque iat va en segundos).
  if (u.sesionesDesde && emitido * 1000 < u.sesionesDesde.getTime() - 1000) return null;
  return { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol };
});

export async function requerirUsuario(): Promise<UsuarioSesion> {
  const u = await usuarioActual();
  if (!u) redirect("/login");
  return u;
}

export async function requerirAdmin(): Promise<UsuarioSesion> {
  const u = await requerirUsuario();
  if (u.rol !== "ADMIN") redirect("/");
  return u;
}
