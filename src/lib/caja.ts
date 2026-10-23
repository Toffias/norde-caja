import "server-only";
import { and, asc, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { auditoria, cierres, movimientos, usuarios, type Cierre } from "@/db/schema";
import { periodoActual, siguientePeriodo } from "./periodo";

const montoConSigno = sql<number>`CASE WHEN ${movimientos.tipo} = 'INGRESO' THEN ${movimientos.monto} ELSE -${movimientos.monto} END`;

/** Saldo acumulado de todos los movimientos vigentes anteriores al período. */
export async function saldoAntesDe(periodo: string): Promise<number> {
  const [fila] = await db
    .select({ total: sql<string | null>`SUM(${montoConSigno})` })
    .from(movimientos)
    .where(and(isNull(movimientos.anuladoEn), lt(movimientos.periodo, periodo)));
  return Number(fila?.total ?? 0);
}

export type FilaCaja = {
  id: number;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  concepto: string;
  observaciones: string | null;
  creadoPor: string;
  creadoEn: Date;
  saldo: number;
};

export type ResumenPeriodo = {
  periodo: string;
  saldoInicial: number;
  ingresos: number;
  egresos: number;
  saldoFinal: number;
  filas: FilaCaja[];
  cierre: Cierre | null;
};

/** Movimientos vigentes del mes en orden cronológico, con el saldo corrido fila por fila. */
export async function resumenPeriodo(periodo: string): Promise<ResumenPeriodo> {
  const [saldoInicial, lista, cierre] = await Promise.all([
    saldoAntesDe(periodo),
    db
      .select({
        id: movimientos.id,
        fecha: movimientos.fecha,
        tipo: movimientos.tipo,
        monto: movimientos.monto,
        concepto: movimientos.concepto,
        observaciones: movimientos.observaciones,
        creadoPor: usuarios.nombre,
        creadoEn: movimientos.creadoEn,
      })
      .from(movimientos)
      .innerJoin(usuarios, eq(usuarios.id, movimientos.creadoPor))
      .where(and(eq(movimientos.periodo, periodo), isNull(movimientos.anuladoEn)))
      .orderBy(asc(movimientos.fecha), asc(movimientos.id)),
    db.query.cierres.findFirst({ where: eq(cierres.periodo, periodo) }),
  ]);

  let saldo = saldoInicial;
  let ingresos = 0;
  let egresos = 0;
  const filas = lista.map((m) => {
    if (m.tipo === "INGRESO") {
      ingresos += m.monto;
      saldo += m.monto;
    } else {
      egresos += m.monto;
      saldo -= m.monto;
    }
    return { ...m, saldo };
  });

  return { periodo, saldoInicial, ingresos, egresos, saldoFinal: saldo, filas, cierre: cierre ?? null };
}

/** Último movimiento cargado (vigente) del período: el que se puede anular. */
export async function ultimoMovimiento(periodo: string) {
  return db.query.movimientos.findFirst({
    where: and(eq(movimientos.periodo, periodo), isNull(movimientos.anuladoEn)),
    orderBy: desc(movimientos.id),
  });
}

async function fotoPeriodo(periodo: string) {
  const r = await resumenPeriodo(periodo);
  return {
    saldoInicial: r.saldoInicial,
    ingresos: r.ingresos,
    egresos: r.egresos,
    saldoFinal: r.saldoFinal,
  };
}

/**
 * Cierra automáticamente todos los meses anteriores al vigente que todavía no tengan cierre.
 * Se llama al cargar la caja, así el cierre ocurre la primera vez que alguien entra en el mes nuevo.
 */
export async function asegurarCierres(): Promise<void> {
  const actual = periodoActual();
  const [primero] = await db
    .select({ periodo: sql<string | null>`MIN(${movimientos.periodo})` })
    .from(movimientos);
  if (!primero?.periodo) return;

  const cerrados = new Set(
    (await db.select({ periodo: cierres.periodo }).from(cierres)).map((c) => c.periodo),
  );

  for (let p = primero.periodo; p < actual; p = siguientePeriodo(p)) {
    if (cerrados.has(p)) continue;
    const foto = await fotoPeriodo(p);
    // INSERT IGNORE: si dos pedidos llegan juntos, sólo uno crea el cierre.
    const [res] = await db.insert(cierres).ignore().values({ periodo: p, ...foto, cerradoPor: null });
    if (res.affectedRows > 0) {
      await db.insert(auditoria).values({
        usuarioId: null,
        accion: "CERRAR_MES",
        periodo: p,
        detalle: { automatico: true, ...foto },
      });
    }
  }
}

/** Después de que un admin toca un mes cerrado, actualiza la foto de ese cierre y de los siguientes. */
export async function recalcularCierresDesde(periodo: string): Promise<void> {
  const afectados = await db
    .select({ periodo: cierres.periodo })
    .from(cierres)
    .where(gte(cierres.periodo, periodo))
    .orderBy(asc(cierres.periodo));
  for (const { periodo: p } of afectados) {
    await db.update(cierres).set(await fotoPeriodo(p)).where(eq(cierres.periodo, p));
  }
}

/** Meses que se pueden consultar: los cerrados y el vigente, del más nuevo al más viejo. */
export async function periodosDisponibles(): Promise<string[]> {
  const actual = periodoActual();
  const lista = await db.select({ periodo: cierres.periodo }).from(cierres);
  const todos = new Set([actual, ...lista.map((c) => c.periodo)]);
  return [...todos].sort().reverse();
}

const anulador = alias(usuarios, "anulador");

export type FilaAuditoria = {
  id: number;
  fecha: Date;
  usuario: string | null;
  accion: string;
  movimientoId: number | null;
  periodo: string | null;
  detalle: unknown;
};

export async function listarAuditoria(limite = 300): Promise<FilaAuditoria[]> {
  return db
    .select({
      id: auditoria.id,
      fecha: auditoria.fecha,
      usuario: anulador.nombre,
      accion: auditoria.accion,
      movimientoId: auditoria.movimientoId,
      periodo: auditoria.periodo,
      detalle: auditoria.detalle,
    })
    .from(auditoria)
    .leftJoin(anulador, eq(anulador.id, auditoria.usuarioId))
    .orderBy(desc(auditoria.fecha), desc(auditoria.id))
    .limit(limite);
}
