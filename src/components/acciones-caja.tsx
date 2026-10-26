"use client";

import { useActionState, useEffect, useState } from "react";
import { anularUltimo, borrarMovimiento } from "@/app/acciones/movimientos";
import type { Tipo } from "@/db/schema";
import { FormMovimiento } from "./form-movimiento";
import { IconoDeshacer, IconoLapiz, IconoMas, IconoMenos } from "./iconos";
import { Modal } from "./modal";

type Ultimo = { id: number; descripcion: string } | null;

/** Botones de la caja: nuevo ingreso, nuevo egreso y anular el último movimiento, cada uno con su modal. */
export function AccionesCaja({
  caja,
  nombreCaja,
  periodo,
  fechaInicial,
  fechaMin,
  fechaMax,
  ultimo,
}: {
  /** Slug de la caja en la que se carga (va en el formulario). */
  caja: string;
  nombreCaja: string;
  periodo: string;
  fechaInicial: string;
  fechaMin?: string;
  fechaMax?: string;
  ultimo: Ultimo;
}) {
  const [nuevo, setNuevo] = useState<Tipo | null>(null);
  const [anular, setAnular] = useState(false);

  return (
    <>
      <button className="btn-ingreso" onClick={() => setNuevo("INGRESO")}>
        <IconoMas /> Ingreso
      </button>
      <button className="btn-primario" onClick={() => setNuevo("EGRESO")}>
        <IconoMenos /> Egreso
      </button>
      <button className="btn-secundario" onClick={() => setAnular(true)} disabled={!ultimo}>
        <IconoDeshacer /> Anular último
      </button>

      <Modal abierto={nuevo !== null} onCerrar={() => setNuevo(null)} titulo={`Nuevo movimiento · ${nombreCaja}`}>
        <FormMovimiento
          caja={caja}
          tipoInicial={nuevo ?? "EGRESO"}
          fechaInicial={fechaInicial}
          fechaMin={fechaMin}
          fechaMax={fechaMax}
          onListo={() => setNuevo(null)}
        />
      </Modal>

      <Modal abierto={anular} onCerrar={() => setAnular(false)} titulo={`Anular último movimiento · ${nombreCaja}`}>
        {ultimo && <ConfirmarAnular periodo={periodo} ultimo={ultimo} onListo={() => setAnular(false)} />}
      </Modal>
    </>
  );
}

function ConfirmarAnular({
  periodo,
  ultimo,
  onListo,
}: {
  periodo: string;
  ultimo: NonNullable<Ultimo>;
  onListo: () => void;
}) {
  const [estado, accion, enviando] = useActionState(anularUltimo, {});
  useEffect(() => {
    if (estado.ok) onListo();
  }, [estado, onListo]);

  return (
    <form action={accion} className="space-y-5">
      <input type="hidden" name="id" value={ultimo.id} />
      <input type="hidden" name="periodo" value={periodo} />
      <div className="rounded-xl bg-muted px-4 py-3 text-sm">{ultimo.descripcion}</div>
      <p className="text-sm text-muted-foreground">
        El movimiento deja de contar en el saldo. La anulación queda registrada en el log con tu usuario y la hora.
      </p>
      {estado.error && <p className="text-sm font-medium text-egreso">{estado.error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secundario" onClick={onListo}>
          Cancelar
        </button>
        <button className="btn-primario" disabled={enviando}>
          {enviando ? "Anulando…" : "Sí, anular"}
        </button>
      </div>
    </form>
  );
}

type DatosMovimiento = {
  id: number;
  fecha: string;
  tipo: Tipo;
  monto: number;
  concepto: string;
  observaciones: string | null;
};

/** Botón de edición de una fila: abre el modal con el formulario y, para el admin, la opción de borrar. */
export function EditarMovimiento({
  m,
  fechaMin,
  fechaMax,
  puedeBorrar,
}: {
  m: DatosMovimiento;
  fechaMin?: string;
  fechaMax: string;
  puedeBorrar: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button className="icono-btn size-8" onClick={() => setAbierto(true)} aria-label={`Editar movimiento ${m.concepto}`}>
        <IconoLapiz />
      </button>
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo={`Editar movimiento #${m.id}`}>
        <FormMovimiento
          fechaInicial={m.fecha}
          fechaMin={fechaMin}
          fechaMax={fechaMax}
          editar={m}
          onListo={() => setAbierto(false)}
        />
        {puedeBorrar && <BorrarMovimiento id={m.id} onListo={() => setAbierto(false)} />}
      </Modal>
    </>
  );
}

function BorrarMovimiento({ id, onListo }: { id: number; onListo: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  const [estado, accion, enviando] = useActionState(borrarMovimiento, {});
  useEffect(() => {
    if (estado.ok) onListo();
  }, [estado, onListo]);

  return (
    <form action={accion} className="mt-5 border-t border-line pt-5">
      <input type="hidden" name="id" value={id} />
      {!confirmar ? (
        <button type="button" className="btn-peligro w-full" onClick={() => setConfirmar(true)}>
          Borrar movimiento
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Seguro? El saldo se recalcula y el borrado queda registrado en el log.
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-secundario flex-1" onClick={() => setConfirmar(false)}>
              No
            </button>
            <button className="btn-peligro flex-1" disabled={enviando}>
              {enviando ? "Borrando…" : "Sí, borrar"}
            </button>
          </div>
        </div>
      )}
      {estado.error && <p className="mt-2 text-sm font-medium text-egreso">{estado.error}</p>}
    </form>
  );
}
