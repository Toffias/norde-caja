"use client";

import { IconoLuna, IconoSol } from "./iconos";

/** Alterna claro/oscuro. El tema vive en data-theme de <html> y se recuerda en este navegador. */
export function BotonTema() {
  function alternar() {
    const raiz = document.documentElement;
    const nuevo = raiz.dataset.theme === "dark" ? "light" : "dark";
    raiz.dataset.theme = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {}
  }
  return (
    <button type="button" onClick={alternar} className="icono-btn" aria-label="Cambiar entre modo claro y oscuro">
      <span className="hidden dark:inline">
        <IconoSol />
      </span>
      <span className="dark:hidden">
        <IconoLuna />
      </span>
    </button>
  );
}
