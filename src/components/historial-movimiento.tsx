"use client";

import { useState } from "react";
import { IconoHistorial } from "./iconos";
import { Modal } from "./modal";

export type CambioVista = { campo: string; antes: string; despues: string };
export type EdicionVista = { id: number; cuando: string; usuario: string; cambios: CambioVista[] };

/** Icono de historial de una fila: abre una línea de tiempo con las ediciones que tuvo el movimiento. */
export function HistorialMovimiento({ concepto, ediciones }: { concepto: string; ediciones: EdicionVista[] }) {
  const [abierto, setAbierto] = useState(false);
  const titulo = ediciones.length === 1 ? "1 edición" : `${ediciones.length} ediciones`;
  return (
    <>
      <button
        className="icono-btn size-8"
        onClick={() => setAbierto(true)}
        aria-label={`Ver historial de ${concepto} (${titulo})`}
        title={titulo}
      >
        <IconoHistorial />
      </button>
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Historial del movimiento">
        <p className="mb-5 text-sm text-muted-foreground">
          {titulo} de <span className="font-semibold text-foreground">{concepto}</span>, de la más reciente a la más
          vieja.
        </p>
        <ol className="relative ml-2 space-y-6 border-l-2 border-line pl-6">
          {[...ediciones].reverse().map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[31px] top-1 size-4 rounded-full border-2 border-brand bg-card" aria-hidden />
              <div className="text-xs font-semibold text-muted-foreground">
                <span className="num">{e.cuando}</span> · {e.usuario}
              </div>
              <ul className="mt-1.5 space-y-1 text-sm">
                {e.cambios.map((c) => (
                  <li key={c.campo} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {c.campo}
                    </span>
                    <span className="text-muted-foreground line-through">{c.antes || "(vacío)"}</span>
                    <span className="font-semibold">{c.despues || "(vacío)"}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}
