import { AccionesCaja, EditarMovimiento } from "@/components/acciones-caja";
import { IconoDescarga } from "@/components/iconos";
import { SelectorMes } from "@/components/selector-mes";
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
    texto: p === actual ? `${nombrePeriodo(p)} (vigente)` : nombrePeriodo(p),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Caja</h1>
        <SelectorMes periodo={periodo} opciones={opciones} />
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
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
        {resumen.filas.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Todavía no hay movimientos en este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-bold">Fecha</th>
                  <th className="px-3 py-3 font-bold">Tipo</th>
                  <th className="px-3 py-3 font-bold">Concepto</th>
                  <th className="px-3 py-3 font-bold">Observaciones</th>
                  <th className="px-3 py-3 font-bold">Cargó</th>
                  <th className="px-3 py-3 text-right font-bold">Ingreso</th>
                  <th className="px-3 py-3 text-right font-bold">Egreso</th>
                  <th className="px-5 py-3 text-right font-bold">Saldo</th>
                  {esAdmin && <th className="w-px px-3 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr className="text-muted-foreground">
                  <td className="px-5 py-2.5 num">{fechaCorta(primerDia(periodo))}</td>
                  <td className="px-3 py-2.5" colSpan={6}>
                    Saldo inicial del mes
                  </td>
                  <td className="px-5 py-2.5 text-right num font-semibold">{pesos(resumen.saldoInicial)}</td>
                  {esAdmin && <td />}
                </tr>
                {resumen.filas.map((f) => (
                  <tr key={f.id} className="transition hover:bg-muted/40">
                    <td className="whitespace-nowrap px-5 py-3 num">{fechaCorta(f.fecha)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
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
                      className={`whitespace-nowrap px-5 py-3 text-right num font-bold ${
                        f.saldo < 0 ? "text-egreso" : ""
                      }`}
                    >
                      {pesos(f.saldo)}
                    </td>
                    {esAdmin && (
                      <td className="px-3 py-2">
                        <EditarMovimiento
                          m={{
                            id: f.id,
                            fecha: f.fecha,
                            tipo: f.tipo,
                            monto: f.monto,
                            concepto: f.concepto,
                            observaciones: f.observaciones,
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
