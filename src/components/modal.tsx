"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconoCerrar } from "./iconos";

/** Ventana modal sobre <dialog>: cierra con Esc, con la X o tocando afuera. */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      // showModal enfoca el primer botón; llevamos el foco al campo principal del formulario.
      d.querySelector<HTMLElement>("[data-autofoco]")?.focus();
    }
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-card p-0 text-foreground shadow-2xl"
    >
      {abierto && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-lg font-extrabold tracking-tight">{titulo}</h2>
            <button type="button" onClick={onCerrar} className="icono-btn -mr-2 -mt-1 border-0" aria-label="Cerrar">
              <IconoCerrar />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
