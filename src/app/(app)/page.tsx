import { AccionesCaja } from "@/components/acciones-caja";
import { IconoDescarga } from "@/components/iconos";
import { SelectorMes } from "@/components/selector-mes";
import { TablaMovimientos } from "@/components/tabla-movimientos";
import { requerirUsuario } from "@/lib/auth";
import { asegurarCierres, periodosDisponibles, resumenPeriodo, ultimoMovimiento } from "@/lib/caja";
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

  const actual = periodoActual();
  const pedido = (await searchParams).mes;
  const periodo = typeof pedido === "string" && esPeriodo(pedido) && pedido <= actual ? pedido : actual;
  const esActual = periodo === actual;
  const puedeEditar = esAdmin || esActual;

  const [resumen, periodos, ultimo] = await Promise.all([
    resumenPeriodo(periodo),
    periodosDisponibles(),
    puedeEditar ? ultimoMovimiento(periodo) : null,
  ]);
  const opciones = (periodos.includes(periodo) ? periodos : [periodo, ...periodos]).map((p) => ({
    valor: p,
    texto: nombrePeriodo(p),
    detalle: p === actual ? "vigente" : "cerrado",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Caja</h1>
        <SelectorMes periodo={periodo} opciones={opciones} />
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
              periodo={periodo}
              fechaInicial={esActual ? hoy() : ultimoDia(periodo)}
              fechaMin={esAdmin ? undefined : primerDia(periodo)}
              fechaMax={esAdmin ? undefined : hoy()}
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
          <a href={`/api/exportar?mes=${periodo}`} className="btn-secundario">
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
          <h2 className="font-extrabold tracking-tight">Movimientos de {nombrePeriodo(periodo)}</h2>
          <span className="text-xs font-semibold text-muted-foreground">{resumen.filas.length} movimientos</span>
        </div>
        <TablaMovimientos
          filas={resumen.filas}
          saldoInicial={resumen.saldoInicial}
          desde={primerDia(periodo)}
          hasta={ultimoDia(periodo)}
          esAdmin={esAdmin}
        />
      </section>
    </div>
  );
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
