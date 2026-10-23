// Importa los movimientos de la planilla "caja oficina CORREGIDA.xlsm" (hoja CAJA, desde la fila 9).
// Uso: pnpm importar-excel "C:\ruta\caja oficina CORREGIDA.xlsm" <usuario-admin>
// Sólo corre si la tabla de movimientos está vacía, para no duplicar datos.
import ExcelJS from "exceljs";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "./db";
import { movimientos, usuarios } from "../src/db/schema";

const FILA_INICIO = 9;
const COL = { fecha: 2, tipo: 3, detalle: 4, ingresado: 7, gastado: 8, observaciones: 12 };

function texto(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object" && "richText" in v) return v.richText.map((t) => t.text).join("");
  if (typeof v === "object" && "result" in v) return String(v.result ?? "");
  return String(v);
}

function numero(v: ExcelJS.CellValue): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "result" in v) return Number(v.result ?? 0);
  return Number(v ?? 0);
}

// "Se pagó $ 30.000 en concepto de: LIMPIEZA OFICINA" -> "LIMPIEZA OFICINA"
function concepto(detalle: string): string {
  const limpio = detalle
    .replace(/^Se (ingresaron|pagó)\s*\$\s*[\d.,]+\s*(a caja)?\s*(en concepto de)?\s*:?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return limpio || detalle.trim() || "(sin detalle)";
}

async function main() {
  const [archivo, usuarioAdmin] = process.argv.slice(2);
  if (!archivo || !usuarioAdmin) {
    console.error('Uso: pnpm importar-excel "<archivo.xlsm>" <usuario-admin>');
    process.exit(1);
  }

  const admin = await db.query.usuarios.findFirst({ where: eq(usuarios.usuario, usuarioAdmin) });
  if (!admin) throw new Error(`No existe el usuario "${usuarioAdmin}". Crealo antes con pnpm crear-admin.`);

  const [{ cantidad }] = await db.select({ cantidad: sql<number>`COUNT(*)` }).from(movimientos);
  if (Number(cantidad) > 0) throw new Error("La tabla de movimientos ya tiene datos; no se importa para no duplicar.");

  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(archivo);
  const hoja = libro.getWorksheet("CAJA");
  if (!hoja) throw new Error('El archivo no tiene la hoja "CAJA".');

  const filas: (typeof movimientos.$inferInsert)[] = [];
  for (let r = FILA_INICIO; r <= hoja.rowCount; r++) {
    const fila = hoja.getRow(r);
    const f = fila.getCell(COL.fecha).value;
    if (!(f instanceof Date)) continue;
    const fecha = f.toISOString().slice(0, 10);
    const esIngreso = texto(fila.getCell(COL.tipo).value).startsWith("Ingreso");
    const monto = esIngreso ? numero(fila.getCell(COL.ingresado).value) : numero(fila.getCell(COL.gastado).value);
    const detalle = texto(fila.getCell(COL.detalle).value);
    const obs = texto(fila.getCell(COL.observaciones).value).trim();
    filas.push({
      fecha,
      periodo: fecha.slice(0, 7),
      tipo: esIngreso ? "INGRESO" : "EGRESO",
      monto,
      concepto: concepto(detalle).slice(0, 255),
      observaciones: obs ? obs.slice(0, 500) : null,
      creadoPor: admin.id,
    });
  }

  if (filas.length === 0) throw new Error("No se encontraron movimientos en la hoja.");
  await db.insert(movimientos).values(filas);

  const ingresos = filas.filter((f) => f.tipo === "INGRESO").reduce((s, f) => s + f.monto, 0);
  const egresos = filas.filter((f) => f.tipo === "EGRESO").reduce((s, f) => s + f.monto, 0);
  console.log(`Importados ${filas.length} movimientos. Ingresos ${ingresos} · Egresos ${egresos} · Saldo ${ingresos - egresos}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
