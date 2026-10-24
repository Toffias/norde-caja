"use client";

import { useActionState, useState } from "react";
import { ingresar } from "@/app/acciones/sesion";
import { IconoOjo, IconoOjoTachado } from "@/components/iconos";

export function FormLogin() {
  const [estado, accion, enviando] = useActionState(ingresar, {});
  const [verPassword, setVerPassword] = useState(false);
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
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verPassword ? "text" : "password"}
            className="input pr-11"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={verPassword}
          >
            {verPassword ? <IconoOjoTachado /> : <IconoOjo />}
          </button>
        </div>
      </div>
      {estado.error && <p className="text-sm font-medium text-egreso">{estado.error}</p>}
      <button className="btn-primario w-full" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
