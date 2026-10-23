"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditoria, cierres, movimientos, TIPOS, type Movimiento, type Tipo } from "@/db/schema";
import { requerirAdmin, requerirUsuario } from "@/lib/auth";
import { asegurarCierres, recalcularCierresDesde, ultimoMovimiento } from "@/lib/caja";
import { leerMonto, type EstadoForm } from "@/lib/montos";
import { esFecha, esPeriodo, periodoActual, periodoDe } from "@/lib/periodo";

async function estaCerrado(periodo: string): Promise<boolean> {
  return !!(await db.query.cierres.findFirst({ where: eq(cierres.periodo, periodo) }));
}

function foto(m: Movimiento) {
  return {
    fecha: m.fecha,
    tipo: m.tipo,
    monto: m.monto,
    concepto: m.concepto,
    observaciones: m.observaciones,
  };
}

type Datos = { fecha: string; tipo: Tipo; monto: number; concepto: string; observaciones: string | null };

function leerDatos(form: FormData): Datos | string {
  const tipo = String(form.get("tipo") ?? "") as Tipo;
  const fecha = String(form.get("fecha") ?? "");
  const monto = leerMonto(String(form.get("monto") ?? ""));
  const concepto = String(form.get("concepto") ?? "").trim().replace(/\s+/g, " ");
  const observaciones = String(form.get("observaciones") ?? "").trim() || null;
  if (!TIPOS.includes(tipo)) return "Elegí si es un ingreso o un egreso.";
  if (!esFecha(fecha)) return "La fecha no es válida.";
  if (monto === null) return "Ingresá un monto mayor a cero (por ejemplo 125.000).";
  if (!concepto) return "Escribí el concepto.";
  if (concepto.length > 255) return "El concepto es demasiado largo (máximo 255 caracteres).";
  if (observaciones && observaciones.length > 500) return "Las observaciones son demasiado largas.";
  return { tipo, fecha, monto, concepto, observaciones };
}

function refrescar() {
  revalidatePath("/", "layout");
}

export async function crearMovimiento(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const yo = await requerirUsuario();
  await asegurarCierres();
  const datos = leerDatos(form);
  if (typeof datos === "string") return { error: datos };

  const periodo = periodoDe(datos.fecha);
  if (yo.rol !== "ADMIN" && periodo !== periodoActual()) {
    return { error: "Sólo podés cargar movimientos del mes vigente." };
  }
  const cerrado = await estaCerrado(periodo);

  const [res] = await db.insert(movimientos).values({ ...datos, periodo, creadoPor: yo.id });
  if (cerrado) {
    await db.insert(auditoria).values({
      usuarioId: yo.id,
      accion: "CREAR_MES_CERRADO",
      movimientoId: res.insertId,
      periodo,
      detalle: { nuevo: datos },
    });
    await recalcularCierresDesde(periodo);
  }
  refrescar();
  return { ok: datos.tipo === "INGRESO" ? "Ingreso registrado." : "Egreso registrado." };
}

export async function anularUltimo(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const yo = await requerirUsuario();
  await asegurarCierres();
  const periodo = String(form.get("periodo") ?? "");
  const idEsperado = Number(form.get("id"));
  if (!esPeriodo(periodo)) return { error: "Mes inválido." };
  if (yo.rol !== "ADMIN" && periodo !== periodoActual()) {
    return { error: "Sólo podés anular movimientos del mes vigente." };
  }

  const ultimo = await ultimoMovimiento(periodo);
  if (!ultimo) return { error: "No quedan movimientos para anular en este mes." };
  // Si otra persona cargó algo mientras tanto, no anulamos algo distinto a lo que se confirmó.
  if (ultimo.id !== idEsperado) {
    refrescar();
    return { error: "El último movimiento cambió. Revisá la lista y volvé a intentar." };
  }

  const [res] = await db
    .update(movimientos)
    .set({ anuladoEn: new Date(), anuladoPor: yo.id })
    .where(and(eq(movimientos.id, ultimo.id), isNull(movimientos.anuladoEn)));
  if (res.affectedRows === 0) return { error: "Ese movimiento ya fue anulado." };

  await db.insert(auditoria).values({
    usuarioId: yo.id,
    accion: "ANULAR",
    movimientoId: ultimo.id,
    periodo,
    detalle: { movimiento: foto(ultimo) },
  });
  if (await estaCerrado(periodo)) await recalcularCierresDesde(periodo);
  refrescar();
  return { ok: "Movimiento anulado. Quedó registrado en el log." };
}

export async function editarMovimiento(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const yo = await requerirAdmin();
  const id = Number(form.get("id"));
  const actual = await db.query.movimientos.findFirst({ where: eq(movimientos.id, id) });
  if (!actual || actual.anuladoEn) return { error: "El movimiento no existe o está anulado." };
  const datos = leerDatos(form);
  if (typeof datos === "string") return { error: datos };

  const periodo = periodoDe(datos.fecha);
  await db.update(movimientos).set({ ...datos, periodo }).where(eq(movimientos.id, id));
  await db.insert(auditoria).values({
    usuarioId: yo.id,
    accion: "EDITAR",
    movimientoId: id,
    periodo: actual.periodo,
    detalle: { antes: foto(actual), despues: datos },
  });
  await recalcularCierresDesde(periodo < actual.periodo ? periodo : actual.periodo);
  refrescar();
  return { ok: "Cambios guardados." };
}

export async function borrarMovimiento(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const yo = await requerirAdmin();
  const id = Number(form.get("id"));
  const actual = await db.query.movimientos.findFirst({ where: eq(movimientos.id, id) });
  if (!actual || actual.anuladoEn) return { error: "El movimiento no existe o ya fue borrado." };

  await db
    .update(movimientos)
    .set({ anuladoEn: new Date(), anuladoPor: yo.id })
    .where(eq(movimientos.id, id));
  await db.insert(auditoria).values({
    usuarioId: yo.id,
    accion: "BORRAR",
    movimientoId: id,
    periodo: actual.periodo,
    detalle: { movimiento: foto(actual) },
  });
  await recalcularCierresDesde(actual.periodo);
  refrescar();
  return { ok: "Movimiento borrado." };
}
