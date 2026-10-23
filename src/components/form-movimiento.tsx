"use client";

import { useActionState, useEffect, useState } from "react";
import { crearMovimiento, editarMovimiento } from "@/app/acciones/movimientos";
import type { Tipo } from "@/db/schema";

type Props = {
  tipoInicial?: Tipo;
  fechaMin?: string;
  fechaMax?: string;
  fechaInicial: string;
  /** Se llama cuando el movimiento se guardó bien (por ejemplo, para cerrar el modal). */
  onListo?: () => void;
  /** Si viene, el formulario edita ese movimiento en lugar de crear uno nuevo. */
  editar?: {
    id: number;
    tipo: Tipo;
    monto: number;
    concepto: string;
    observaciones: string | null;
  };
};

export function FormMovimiento({ tipoInicial, fechaMin, fechaMax, fechaInicial, onListo, editar }: Props) {
  const [estado, accion, enviando] = useActionState(editar ? editarMovimiento : crearMovimiento, {});
  const [tipo, setTipo] = useState<Tipo>(editar?.tipo ?? tipoInicial ?? "EGRESO");

  useEffect(() => {
    if (estado.ok) onListo?.();
  }, [estado, onListo]);

  return (
    <form action={accion} className="space-y-4">
      {editar && <input type="hidden" name="id" value={editar.id} />}
      <input type="hidden" name="tipo" value={tipo} />

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Tipo de movimiento">
        {(["INGRESO", "EGRESO"] as const).map((t) => {
          const activo = tipo === t;
          const color = t === "INGRESO" ? "bg-card text-ingreso shadow-sm" : "bg-card text-egreso shadow-sm";
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => setTipo(t)}
              className={`rounded-md px-4 py-2 text-sm font-bold transition ${
                activo ? color : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "INGRESO" ? "Ingreso a caja" : "Egreso / gasto"}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="monto">
            Monto ($)
          </label>
          <input
            id="monto"
            name="monto"
            className="input num text-base font-semibold"
            inputMode="decimal"
            placeholder="125.000"
            defaultValue={editar ? new Intl.NumberFormat("es-AR").format(editar.monto) : ""}
            data-autofoco
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="fecha">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            className="input"
            defaultValue={fechaInicial}
            min={fechaMin}
            max={fechaMax}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="concepto">
          Concepto
        </label>
        <input
          id="concepto"
          name="concepto"
          className="input"
          placeholder={tipo === "INGRESO" ? "Ej: Administración" : "Ej: Limpieza oficina"}
          maxLength={255}
          defaultValue={editar?.concepto}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="observaciones">
          Observaciones (opcional)
        </label>
        <input
          id="observaciones"
          name="observaciones"
          className="input"
          maxLength={500}
          defaultValue={editar?.observaciones ?? ""}
        />
      </div>

      {estado.error && <p className="text-sm font-medium text-egreso">{estado.error}</p>}

      <button className={`${tipo === "INGRESO" ? "btn-ingreso" : "btn-primario"} w-full`} disabled={enviando}>
        {enviando
          ? "Guardando…"
          : editar
            ? "Guardar cambios"
            : tipo === "INGRESO"
              ? "Agregar a caja"
              : "Registrar gasto"}
      </button>
    </form>
  );
}
