import { requerirAdmin } from "@/lib/auth";
import { listarAuditoria } from "@/lib/caja";
import { CAJAS, cajaDeSlug, nombreCaja, slugDe, type CajaId } from "@/lib/cajas";
import { fechaCorta, fechaHora, nombrePeriodo, pesos } from "@/lib/periodo";

type Foto = { fecha: string; tipo: string; monto: number; concepto: string };

const ACCIONES: Record<string, { texto: string; clase: string }> = {
  ANULAR: { texto: "Anuló último movimiento", clase: "bg-egreso-bg text-egreso" },
  BORRAR: { texto: "Borró movimiento", clase: "bg-egreso-bg text-egreso" },
  EDITAR: { texto: "Editó movimiento", clase: "bg-muted text-foreground" },
  CREAR_MES_CERRADO: { texto: "Cargó en mes cerrado", clase: "bg-muted text-foreground" },
  CERRAR_MES: { texto: "Cierre de mes", clase: "bg-ingreso-bg text-ingreso" },
};

function describir(f?: Foto) {
  if (!f) return "";
  return `${fechaCorta(f.fecha)} · ${f.tipo === "INGRESO" ? "Ingreso" : "Egreso"} ${pesos(f.monto)} · ${f.concepto}`;
}

export default async function AuditoriaPage({ searchParams }: PageProps<"/auditoria">) {
  await requerirAdmin();
  const params = await searchParams;
  const todo = params.ver === "todo";
  const caja = cajaDeSlug(typeof params.caja === "string" ? params.caja : null) ?? undefined;
  const filas = await listarAuditoria(300, todo ? undefined : ["ANULAR", "BORRAR", "EDITAR"], caja);
  const url = (ver: boolean, c?: CajaId) => {
    const q = new URLSearchParams();
    if (ver) q.set("ver", "todo");
    if (c) q.set("caja", slugDe(c));
    return q.size ? `/auditoria?${q}` : "/auditoria";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Log de anulaciones</h1>
        <div className="ml-auto flex flex-wrap gap-2 text-sm">
          <a href={url(false, caja)} className={todo ? "btn-secundario" : "btn-primario"}>
            Anulaciones, borrados y ediciones
          </a>
          <a href={url(true, caja)} className={todo ? "btn-primario" : "btn-secundario"}>
            Todo (incluye cierres)
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <a href={url(todo)} className={caja ? "btn-secundario" : "btn-primario"}>
          Todas las cajas
        </a>
        {CAJAS.map((c) => (
          <a key={c} href={url(todo, c)} className={caja === c ? "btn-primario" : "btn-secundario"}>
            <span className="size-2.5 rounded-full" style={{ background: `var(--caja-${slugDe(c)})` }} aria-hidden />
            {nombreCaja(c)}
          </a>
        ))}
      </div>

      <section className="card overflow-x-auto">
        {filas.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No hay registros.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Cuándo</th>
                <th className="px-4 py-2 font-medium">Quién</th>
                <th className="px-4 py-2 font-medium">Caja</th>
                <th className="px-4 py-2 font-medium">Acción</th>
                <th className="px-4 py-2 font-medium">Mes</th>
                <th className="px-4 py-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filas.map((f) => {
                const a = ACCIONES[f.accion] ?? { texto: f.accion, clase: "" };
                const d = (f.detalle ?? {}) as {
                  movimiento?: Foto;
                  antes?: Foto;
                  despues?: Foto;
                  nuevo?: Foto;
                  saldoFinal?: number;
                };
                return (
                  <tr key={f.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-2.5 num">{fechaHora(f.fecha)}</td>
                    <td className="px-4 py-2.5">{f.usuario ?? "Sistema"}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: `var(--caja-${slugDe(f.caja)})` }}
                          aria-hidden
                        />
                        {nombreCaja(f.caja)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${a.clase}`}>
                        {a.texto}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">{f.periodo ? nombrePeriodo(f.periodo) : ""}</td>
                    <td className="px-4 py-2.5">
                      {d.movimiento && describir(d.movimiento)}
                      {d.nuevo && describir(d.nuevo)}
                      {d.antes && (
                        <>
                          <div className="text-muted-foreground line-through">{describir(d.antes)}</div>
                          <div>{describir(d.despues)}</div>
                        </>
                      )}
                      {f.accion === "CERRAR_MES" && d.saldoFinal !== undefined && (
                        <>Saldo al cierre {pesos(d.saldoFinal)}</>
                      )}
                      {f.movimientoId && <span className="text-xs text-muted-foreground"> (#{f.movimientoId})</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
