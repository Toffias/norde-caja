import ExcelJS from "exceljs";
import { usuarioActual } from "@/lib/auth";
import { asegurarCierres, resumenPeriodo } from "@/lib/caja";
import { CAJA_DEFAULT, cajaDeSlug, nombreCaja, slugDe } from "@/lib/cajas";
import { esPeriodo, nombrePeriodo, periodoActual } from "@/lib/periodo";

const FORMATO_PESOS = '"$"#,##0;[Red]-"$"#,##0';

export async function GET(req: Request) {
  const yo = await usuarioActual();
  if (!yo) return new Response("No autorizado", { status: 401 });

  await asegurarCierres();
  const actual = periodoActual();
  const params = new URL(req.url).searchParams;
  const caja = cajaDeSlug(params.get("caja")) ?? CAJA_DEFAULT;
  const pedido = params.get("mes");
  const periodo = esPeriodo(pedido) && pedido <= actual ? pedido : actual;
  const r = await resumenPeriodo(caja, periodo);

  const libro = new ExcelJS.Workbook();
  libro.creator = "Caja Norde";
  const hoja = libro.addWorksheet(`Caja ${periodo}`, { views: [{ state: "frozen", ySplit: 5 }] });
  hoja.columns = [
    { key: "fecha", width: 12 },
    { key: "tipo", width: 11 },
    { key: "concepto", width: 45 },
    { key: "obs", width: 40 },
    { key: "usuario", width: 18 },
    { key: "ingreso", width: 15 },
    { key: "egreso", width: 15 },
    { key: "saldo", width: 16 },
  ];

  hoja.getCell("A1").value = `${nombreCaja(caja)} — ${nombrePeriodo(periodo)}`;
  hoja.getCell("A1").font = { bold: true, size: 14 };
  hoja.getCell("A2").value = periodo === actual ? "Mes vigente (parcial)" : "Mes cerrado";
  hoja.getCell("A3").value = "Saldo inicial";
  hoja.getCell("H3").value = r.saldoInicial;
  hoja.getCell("H3").numFmt = FORMATO_PESOS;
  hoja.getRow(3).font = { bold: true };

  const encabezado = hoja.getRow(5);
  encabezado.values = ["Fecha", "Tipo", "Concepto", "Observaciones", "Cargado por", "Ingreso", "Egreso", "Saldo"];
  encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
  encabezado.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A5F" } };
  });

  // El saldo va como fórmula (como en la planilla original), con el valor ya calculado.
  let fila = 6;
  for (const m of r.filas) {
    const [a, mes, d] = m.fecha.split("-").map(Number);
    const row = hoja.getRow(fila);
    row.values = [
      new Date(Date.UTC(a, mes - 1, d)),
      m.tipo === "INGRESO" ? "Ingreso" : "Egreso",
      m.concepto,
      m.observaciones ?? "",
      m.creadoPor,
      m.tipo === "INGRESO" ? m.monto : 0,
      m.tipo === "EGRESO" ? m.monto : 0,
    ];
    row.getCell(8).value = {
      formula: fila === 6 ? `H3+F6-G6` : `H${fila - 1}+F${fila}-G${fila}`,
      result: m.saldo,
    };
    row.getCell(1).numFmt = "dd/mm/yyyy";
    for (const c of [6, 7, 8]) row.getCell(c).numFmt = FORMATO_PESOS;
    row.getCell(2).font = { color: { argb: m.tipo === "INGRESO" ? "FF12805C" : "FFC0362C" } };
    fila++;
  }

  const total = hoja.getRow(fila + 1);
  total.getCell(5).value = "Totales";
  total.getCell(6).value = { formula: `SUM(F6:F${Math.max(fila - 1, 6)})`, result: r.ingresos };
  total.getCell(7).value = { formula: `SUM(G6:G${Math.max(fila - 1, 6)})`, result: r.egresos };
  total.getCell(8).value = { formula: `H3+F${fila + 1}-G${fila + 1}`, result: r.saldoFinal };
  for (const c of [6, 7, 8]) total.getCell(c).numFmt = FORMATO_PESOS;
  total.font = { bold: true };

  const buffer = await libro.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="caja-norde-${slugDe(caja)}-${periodo}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
