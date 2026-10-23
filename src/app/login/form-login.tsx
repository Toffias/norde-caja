"use client";

import { useActionState } from "react";
import { ingresar } from "@/app/acciones/sesion";

export function FormLogin() {
  const [estado, accion, enviando] = useActionState(ingresar, {});
  return (
    <form action={accion} className="space-y-4">
      <div>
        <label className="label" htmlFor="usuario">
          Usuario
        </label>
        <input id="usuario" name="usuario" className="input" autoComplete="username" autoFocus required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
      </div>
      {estado.error && <p className="text-sm font-medium text-egreso">{estado.error}</p>}
      <button className="btn-primario w-full" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
