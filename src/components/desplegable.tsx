"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type Opcion = { valor: string; texto: string; detalle?: string };

/**
 * Lista desplegable con estilo propio (las de <select> no se pueden estilizar).
 * Con `name` también envía su valor dentro de un <form>.
 */
export function Desplegable({
  opciones,
  valor,
  onCambio,
  name,
  etiqueta,
  className = "",
  deshabilitado,
}: {
  opciones: Opcion[];
  valor: string;
  onCambio?: (valor: string) => void;
  name?: string;
  etiqueta: string;
  className?: string;
  deshabilitado?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [elegido, setElegido] = useState(valor);
  const [activo, setActivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const id = useId();

  // Si el valor cambia desde afuera (por ejemplo, al navegar), lo reflejamos.
  const [valorPrevio, setValorPrevio] = useState(valor);
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    setElegido(valor);
  }

  const actual = opciones.find((o) => o.valor === elegido) ?? opciones[0];

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", cerrar);
    lista.current?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)?.scrollIntoView({ block: "nearest" });
    return () => document.removeEventListener("pointerdown", cerrar);
  }, [abierto, activo]);

  function abrir() {
    setActivo(Math.max(0, opciones.findIndex((o) => o.valor === elegido)));
    setAbierto(true);
  }

  function elegir(v: string) {
    setElegido(v);
    setAbierto(false);
    onCambio?.(v);
  }

  function teclado(e: KeyboardEvent) {
    if (!abierto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setAbierto(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => Math.min(opciones.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActivo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActivo(opciones.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      elegir(opciones[activo].valor);
    }
  }

  return (
    <div ref={raiz} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={elegido} />}
      <button
        type="button"
        role="combobox"
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-activedescendant={abierto ? `${id}-${activo}` : undefined}
        disabled={deshabilitado}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={teclado}
        className="input flex items-center justify-between gap-3 text-left font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">{actual?.texto}</span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-muted-foreground transition ${abierto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {abierto && (
        <ul
          ref={lista}
          id={`${id}-lista`}
          role="listbox"
          aria-label={etiqueta}
          className="absolute left-0 z-30 mt-1.5 max-h-72 w-full min-w-48 overflow-auto rounded-lg border border-line bg-card p-1 shadow-xl shadow-black/10"
        >
          {opciones.map((o, i) => {
            const seleccionada = o.valor === elegido;
            return (
              <li
                key={o.valor}
                id={`${id}-${i}`}
                data-indice={i}
                role="option"
                aria-selected={seleccionada}
                onPointerEnter={() => setActivo(i)}
                onClick={() => elegir(o.valor)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                  i === activo ? "bg-muted" : ""
                } ${seleccionada ? "font-bold text-brand" : ""}`}
              >
                <span>
                  {o.texto}
                  {o.detalle && <span className="ml-2 text-xs font-medium text-muted-foreground">{o.detalle}</span>}
                </span>
                {seleccionada && (
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
