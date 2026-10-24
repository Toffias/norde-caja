"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditoria, movimientos, TIPOS, type Movimiento, type Tipo } from "@/db/schema";
import { requerirAdmin, requerirUsuario } from "@/lib/auth";
import { asegurarCierres, recalcularCierresDesde, ultimoMovimiento } from "@/lib/caja";
import { leerMonto, type EstadoForm } from "@/lib/montos";
import { esFecha, esPeriodo, hoy, periodoActual, periodoDe } from "@/lib/periodo";

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
  if (fecha > hoy()) return "La fecha no puede ser posterior a hoy.";
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
  // Mes pasado (tenga o no cierre propio): queda en el log y se actualizan los cierres desde ahí,
  // así una carga anterior al primer mes con datos también corrige los saldos de los cierres siguientes.
  const mesPasado = periodo < periodoActual();

  await db.transaction(async (tx) => {
    const [res] = await tx.insert(movimientos).values({ ...datos, periodo, creadoPor: yo.id });
    if (mesPasado) {
      await tx.insert(auditoria).values({
        usuarioId: yo.id,
        accion: "CREAR_MES_CERRADO",
        movimientoId: res.insertId,
        periodo,
        detalle: { nuevo: datos },
      });
      await recalcularCierresDesde(periodo, tx);
    }
  });
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

  const anulado = await db.transaction(async (tx) => {
    const [res] = await tx
      .update(movimientos)
      .set({ anuladoEn: new Date(), anuladoPor: yo.id })
      .where(and(eq(movimientos.id, ultimo.id), isNull(movimientos.anuladoEn)));
    if (res.affectedRows === 0) return false;

    await tx.insert(auditoria).values({
      usuarioId: yo.id,
      accion: "ANULAR",
      movimientoId: ultimo.id,
      periodo,
      detalle: { movimiento: foto(ultimo) },
    });
    if (periodo < periodoActual()) await recalcularCierresDesde(periodo, tx);
    return true;
  });
  if (!anulado) return { error: "Ese movimiento ya fue anulado." };
  refrescar();
  return { ok: "Movimiento anulado. Quedó registrado en el log." };
}

export async function editarMovimiento(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const yo = await requerirUsuario();
  await asegurarCierres();
  const id = Number(form.get("id"));
  const actual = await db.query.movimientos.findFirst({ where: eq(movimientos.id, id) });
  if (!actual || actual.anuladoEn) return { error: "El movimiento no existe o está anulado." };
  const datos = leerDatos(form);
  if (typeof datos === "string") return { error: datos };

  const periodo = periodoDe(datos.fecha);
  // El usuario común sólo edita movimientos del mes vigente y no puede moverlos a otro mes.
  if (yo.rol !== "ADMIN" && (actual.periodo !== periodoActual() || periodo !== periodoActual())) {
    return { error: "Sólo podés editar movimientos del mes vigente, con una fecha de este mes." };
  }
  await db.transaction(async (tx) => {
    await tx.update(movimientos).set({ ...datos, periodo }).where(eq(movimientos.id, id));
    await tx.insert(auditoria).values({
      usuarioId: yo.id,
      accion: "EDITAR",
      movimientoId: id,
      periodo: actual.periodo,
      detalle: { antes: foto(actual), despues: datos },
    });
    await recalcularCierresDesde(periodo < actual.periodo ? periodo : actual.periodo, tx);
  });
  refrescar();
  return { ok: "Cambios guardados." };
}

export async function borrarMovimiento(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const yo = await requerirAdmin();
  const id = Number(form.get("id"));
  const actual = await db.query.movimientos.findFirst({ where: eq(movimientos.id, id) });
  if (!actual || actual.anuladoEn) return { error: "El movimiento no existe o ya fue borrado." };

  const borrado = await db.transaction(async (tx) => {
    const [res] = await tx
      .update(movimientos)
      .set({ anuladoEn: new Date(), anuladoPor: yo.id })
      .where(and(eq(movimientos.id, id), isNull(movimientos.anuladoEn)));
    if (res.affectedRows === 0) return false;
    await tx.insert(auditoria).values({
      usuarioId: yo.id,
      accion: "BORRAR",
      movimientoId: id,
      periodo: actual.periodo,
      detalle: { movimiento: foto(actual) },
    });
    if (actual.periodo < periodoActual()) await recalcularCierresDesde(actual.periodo, tx);
    return true;
  });
  if (!borrado) return { error: "El movimiento ya fue borrado por otra persona." };
  refrescar();
  return { ok: "Movimiento borrado." };
}
