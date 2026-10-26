import { AccionesCaja } from "@/components/acciones-caja";
import { IconoDescarga } from "@/components/iconos";
import { SelectorCaja } from "@/components/selector-caja";
import { SelectorMes } from "@/components/selector-mes";
import type { EdicionVista } from "@/components/historial-movimiento";
import { TablaMovimientos } from "@/components/tabla-movimientos";
import { requerirUsuario } from "@/lib/auth";
import {
  asegurarCierres,
  edicionesDe,
  periodosDisponibles,
  resumenPeriodo,
  ultimoMovimiento,
  type Edicion,
  type FotoMovimiento,
} from "@/lib/caja";
import { CAJA_DEFAULT, cajaDeSlug, nombreCaja, slugDe } from "@/lib/cajas";
import {
  esPeriodo,
  fechaCorta,
  fechaHora,
  hoy,
  nombrePeriodo,
  periodoActual,
  pesos,
  primerDia,
  ultimoDia,
} from "@/lib/periodo";

export default async function CajaPage({ searchParams }: PageProps<"/">) {
  const yo = await requerirUsuario();
  const esAdmin = yo.rol === "ADMIN";
  await asegurarCierres();

  const params = await searchParams;
  // El proxy garantiza que ?caja= venga en la URL; el default es sólo por las dudas.
  const caja = cajaDeSlug(typeof params.caja === "string" ? params.caja : null) ?? CAJA_DEFAULT;
  const slug = slugDe(caja);
  const actual = periodoActual();
  const pedido = params.mes;
  const periodo = typeof pedido === "string" && esPeriodo(pedido) && pedido <= actual ? pedido : actual;
  const esActual = periodo === actual;
  const puedeEditar = esAdmin || esActual;

  const [resumen, periodos, ultimo] = await Promise.all([
    resumenPeriodo(caja, periodo),
    periodosDisponibles(caja),
    puedeEditar ? ultimoMovimiento(caja, periodo) : null,
  ]);
  const historial = Object.fromEntries(
    [...(await edicionesDe(resumen.filas.map((f) => f.id)))].map(([id, lista]) => [id, lista.map(edicionVista)]),
  );
  const opciones = (periodos.includes(periodo) ? periodos : [periodo, ...periodos]).map((p) => ({
    valor: p,
    texto: nombrePeriodo(p),
    detalle: p === actual ? "vigente" : "cerrado",
  }));

  return (
    <div className="space-y-6" data-caja={slug}>
      <SelectorCaja caja={caja} />
      <div className="flex flex-wrap items-center gap-3">
        <SelectorMes caja={slug} periodo={periodo} opciones={opciones} />
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-bold ${
            esActual ? "bg-ingreso-bg text-ingreso" : "bg-muted text-muted-foreground"
          }`}
        >
          {esActual ? "Mes vigente" : "Mes cerrado"}
        </span>
        <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
          {puedeEditar && (
            <AccionesCaja
              caja={slug}
              nombreCaja={nombreCaja(caja)}
              periodo={periodo}
              fechaInicial={esActual ? hoy() : ultimoDia(periodo)}
              fechaMin={esAdmin ? undefined : primerDia(periodo)}
              fechaMax={hoy()}
              ultimo={
                ultimo
                  ? {
                      id: ultimo.id,
                      descripcion: `${fechaCorta(ultimo.fecha)} · ${
                        ultimo.tipo === "INGRESO" ? "Ingreso" : "Egreso"
                      } ${pesos(ultimo.monto)} · ${ultimo.concepto}`,
                    }
                  : null
              }
            />
          )}
          <a href={`/api/exportar?caja=${slug}&mes=${periodo}`} className="btn-secundario">
            <IconoDescarga /> Exportar a Excel
          </a>
        </div>
      </div>

      {resumen.cierre && (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Cerrado el {fechaHora(resumen.cierre.cerradoEn)}
          {resumen.cierre.cerradoPor ? "" : " (cierre automático)"} con un saldo de{" "}
          <strong className="num text-foreground">{pesos(resumen.cierre.saldoFinal)}</strong>.
          {esAdmin
            ? " Como admin podés modificarlo: los cambios recalculan este cierre y los siguientes, y quedan en el log."
            : " Sólo se puede consultar."}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato titulo="Saldo inicial" valor={resumen.saldoInicial} />
        <Dato titulo="Ingresos del mes" valor={resumen.ingresos} color="text-ingreso" />
        <Dato titulo="Egresos del mes" valor={resumen.egresos} color="text-egreso" />
        <Dato
          titulo={esActual ? "Pesos en caja" : "Saldo al cierre"}
          valor={resumen.saldoFinal}
          color={resumen.saldoFinal < 0 ? "text-egreso" : undefined}
          destacado
        />
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-extrabold tracking-tight">
            Movimientos de {nombrePeriodo(periodo)} · <span className="text-brand">{nombreCaja(caja)}</span>
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">{resumen.filas.length} movimientos</span>
        </div>
        <TablaMovimientos
          filas={resumen.filas}
          saldoInicial={resumen.saldoInicial}
          desde={primerDia(periodo)}
          hasta={ultimoDia(periodo)}
          esAdmin={esAdmin}
          puedeEditar={puedeEditar}
          fechaMin={esAdmin ? undefined : primerDia(periodo)}
          fechaMax={hoy()}
          historial={historial}
        />
      </section>
    </div>
  );
}

const CAMPOS: { campo: string; texto: string; ver: (f: FotoMovimiento) => string }[] = [
  { campo: "fecha", texto: "Fecha", ver: (f) => fechaCorta(f.fecha) },
  { campo: "tipo", texto: "Tipo", ver: (f) => (f.tipo === "INGRESO" ? "Ingreso" : "Egreso") },
  { campo: "monto", texto: "Monto", ver: (f) => pesos(f.monto) },
  { campo: "concepto", texto: "Concepto", ver: (f) => f.concepto },
  { campo: "observaciones", texto: "Observaciones", ver: (f) => f.observaciones ?? "" },
];

/** Deja una edición lista para mostrar: fecha formateada y sólo los campos que cambiaron. */
function edicionVista(e: Edicion): EdicionVista {
  const cambios = CAMPOS.map((c) => ({ campo: c.texto, antes: c.ver(e.antes), despues: c.ver(e.despues) })).filter(
    (c) => c.antes !== c.despues,
  );
  return { id: e.id, cuando: fechaHora(e.cuando), usuario: e.usuario ?? "Sistema", cambios };
}

function Dato({
  titulo,
  valor,
  color,
  destacado,
}: {
  titulo: string;
  valor: number;
  color?: string;
  destacado?: boolean;
}) {
  return (
    <div className={`card p-5 ${destacado ? "border-brand/40 ring-1 ring-brand/15" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className={`mt-2 text-xl font-extrabold tracking-tight num sm:text-2xl ${color ?? ""}`}>{pesos(valor)}</p>
    </div>
  );
}
