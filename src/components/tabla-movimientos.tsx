"use client";

import { useMemo, useState } from "react";
import type { Tipo } from "@/db/schema";
import { fechaCorta, pesos } from "@/lib/periodo";
import { EditarMovimiento } from "./acciones-caja";
import { Desplegable } from "./desplegable";

export type FilaTabla = {
  id: number;
  fecha: string;
  tipo: Tipo;
  monto: number;
  concepto: string;
  observaciones: string | null;
  creadoPor: string;
  saldo: number;
};

type Orden = { columna: "fecha" | "saldo"; asc: boolean };

// Búsqueda sin distinguir mayúsculas ni acentos.
const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function TablaMovimientos({
  filas,
  saldoInicial,
  desde: minFecha,
  hasta: maxFecha,
  esAdmin,
}: {
  filas: FilaTabla[];
  saldoInicial: number;
  desde: string;
  hasta: string;
  esAdmin: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [responsable, setResponsable] = useState("TODOS");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [orden, setOrden] = useState<Orden>({ columna: "fecha", asc: true });

  const responsables = useMemo(() => [...new Set(filas.map((f) => f.creadoPor))].sort(), [filas]);
  const hayFiltros = texto.trim() !== "" || tipo !== "TODOS" || responsable !== "TODOS" || !!desde || !!hasta;

  const visibles = useMemo(() => {
    const q = normalizar(texto.trim());
    const lista = filas
      .map((f, i) => ({ ...f, i }))
      .filter(
        (f) =>
          (tipo === "TODOS" || f.tipo === tipo) &&
          (responsable === "TODOS" || f.creadoPor === responsable) &&
          (!desde || f.fecha >= desde) &&
          (!hasta || f.fecha <= hasta) &&
          (!q || normalizar(`${f.concepto} ${f.observaciones ?? ""}`).includes(q)),
      );
    const signo = orden.asc ? 1 : -1;
    return lista.sort((a, b) => signo * (orden.columna === "saldo" ? a.saldo - b.saldo || a.i - b.i : a.i - b.i));
  }, [filas, texto, tipo, responsable, desde, hasta, orden]);

  const ingresos = visibles.reduce((s, f) => s + (f.tipo === "INGRESO" ? f.monto : 0), 0);
  const egresos = visibles.reduce((s, f) => s + (f.tipo === "EGRESO" ? f.monto : 0), 0);
  const mostrarSaldoInicial = orden.columna === "fecha" && orden.asc && !hayFiltros;

  function limpiar() {
    setTexto("");
    setTipo("TODOS");
    setResponsable("TODOS");
    setDesde("");
    setHasta("");
  }

  function ordenarPor(columna: Orden["columna"]) {
    setOrden((o) => (o.columna === columna ? { columna, asc: !o.asc } : { columna, asc: columna === "fecha" }));
  }

  return (
    <>
      <div className="grid gap-3 border-b border-line px-5 py-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] xl:items-end">
        <div className="md:col-span-2 xl:col-span-1">
          <label className="label" htmlFor="buscar">
            Buscar
          </label>
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="buscar"
              type="search"
              className="input pl-9"
              placeholder="Concepto u observaciones"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>
        </div>
        <div>
          <span className="label">Tipo</span>
          <Desplegable
            etiqueta="Filtrar por tipo"
            valor={tipo}
            onCambio={setTipo}
            opciones={[
              { valor: "TODOS", texto: "Todos" },
              { valor: "INGRESO", texto: "Ingresos" },
              { valor: "EGRESO", texto: "Egresos" },
            ]}
          />
        </div>
        <div>
          <span className="label">Cargó</span>
          <Desplegable
            etiqueta="Filtrar por responsable"
            valor={responsable}
            onCambio={setResponsable}
            opciones={[{ valor: "TODOS", texto: "Todos" }, ...responsables.map((r) => ({ valor: r, texto: r }))]}
          />
        </div>
        <div>
          <label className="label" htmlFor="desde">
            Desde
          </label>
          <input
            id="desde"
            type="date"
            className="input"
            min={minFecha}
            max={hasta || maxFecha}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="hasta">
            Hasta
          </label>
          <input
            id="hasta"
            type="date"
            className="input"
            min={desde || minFecha}
            max={maxFecha}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        <button type="button" className="btn-secundario" onClick={limpiar} disabled={!hayFiltros}>
          Limpiar
        </button>
      </div>

      {hayFiltros && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-line bg-muted/50 px-5 py-2.5 text-sm">
          <span className="font-semibold">
            Mostrando {visibles.length} de {filas.length}
          </span>
          <span className="num text-ingreso">Ingresos {pesos(ingresos)}</span>
          <span className="num text-egreso">Egresos {pesos(egresos)}</span>
        </div>
      )}

      {visibles.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          {filas.length === 0 ? "Todavía no hay movimientos en este mes." : "Ningún movimiento coincide con los filtros."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-bold" aria-sort={ariaOrden(orden, "fecha")}>
                  <BotonOrden activo={orden.columna === "fecha"} asc={orden.asc} onClick={() => ordenarPor("fecha")}>
                    Fecha
                  </BotonOrden>
                </th>
                <th className="px-3 py-3 font-bold">Tipo</th>
                <th className="px-3 py-3 font-bold">Concepto</th>
                <th className="px-3 py-3 font-bold">Observaciones</th>
                <th className="px-3 py-3 font-bold">Cargó</th>
                <th className="px-3 py-3 text-right font-bold">Ingreso</th>
                <th className="px-3 py-3 text-right font-bold">Egreso</th>
                <th className="px-5 py-3 text-right font-bold" aria-sort={ariaOrden(orden, "saldo")}>
                  <BotonOrden
                    activo={orden.columna === "saldo"}
                    asc={orden.asc}
                    onClick={() => ordenarPor("saldo")}
                    derecha
                  >
                    Saldo
                  </BotonOrden>
                </th>
                {esAdmin && <th className="w-px px-3 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mostrarSaldoInicial && (
                <tr className="text-muted-foreground">
                  <td className="px-5 py-2.5 num">{fechaCorta(minFecha)}</td>
                  <td className="px-3 py-2.5" colSpan={6}>
                    Saldo inicial del mes
                  </td>
                  <td className="px-5 py-2.5 text-right num font-semibold">{pesos(saldoInicial)}</td>
                  {esAdmin && <td />}
                </tr>
              )}
              {visibles.map((f) => (
                <tr key={f.id} className="transition hover:bg-muted/40">
                  <td className="whitespace-nowrap px-5 py-3 num">{fechaCorta(f.fecha)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${
                        f.tipo === "INGRESO" ? "bg-ingreso-bg text-ingreso" : "bg-egreso-bg text-egreso"
                      }`}
                    >
                      {f.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold">{f.concepto}</td>
                  <td className="max-w-xs px-3 py-3 text-xs text-muted-foreground">{f.observaciones}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{f.creadoPor}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right num font-semibold text-ingreso">
                    {f.tipo === "INGRESO" ? pesos(f.monto) : ""}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right num font-semibold text-egreso">
                    {f.tipo === "EGRESO" ? pesos(f.monto) : ""}
                  </td>
                  <td
                    className={`whitespace-nowrap px-5 py-3 text-right num font-bold ${f.saldo < 0 ? "text-egreso" : ""}`}
                  >
                    {pesos(f.saldo)}
                  </td>
                  {esAdmin && (
                    <td className="px-3 py-2">
                      <EditarMovimiento m={f} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ariaOrden(orden: Orden, columna: Orden["columna"]) {
  if (orden.columna !== columna) return undefined;
  return orden.asc ? "ascending" : "descending";
}

function BotonOrden({
  activo,
  asc,
  onClick,
  derecha,
  children,
}: {
  activo: boolean;
  asc: boolean;
  onClick: () => void;
  derecha?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground ${
        activo ? "text-foreground" : ""
      } ${derecha ? "flex-row-reverse" : ""}`}
    >
      {children}
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
        {activo ? (
          <path d={asc ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
        ) : (
          <path d="m7 10 5-5 5 5M7 14l5 5 5-5" className="opacity-50" />
        )}
      </svg>
    </button>
  );
}
