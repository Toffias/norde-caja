"use client";

import { useActionState, useEffect, useRef } from "react";
import { actualizarUsuario, cambiarMiPassword, crearUsuario } from "@/app/acciones/usuarios";
import type { Rol } from "@/db/schema";

function Mensajes({ estado }: { estado: { error?: string; ok?: string } }) {
  return (
    <>
      {estado.error && <p className="text-sm font-medium text-egreso">{estado.error}</p>}
      {estado.ok && <p className="text-sm text-ingreso">{estado.ok}</p>}
    </>
  );
}

export function FormNuevoUsuario() {
  const [estado, accion, enviando] = useActionState(crearUsuario, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) form.current?.reset();
  }, [estado]);
  return (
    <form ref={form} action={accion} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <div>
        <label className="label" htmlFor="nu-usuario">Usuario</label>
        <input id="nu-usuario" name="usuario" className="input" autoComplete="off" required />
      </div>
      <div>
        <label className="label" htmlFor="nu-nombre">Nombre</label>
        <input id="nu-nombre" name="nombre" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="nu-password">Contraseña</label>
        <input id="nu-password" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <label className="label" htmlFor="nu-rol">Rol</label>
        <select id="nu-rol" name="rol" className="input" defaultValue="USUARIO">
          <option value="USUARIO">Usuario</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <button className="btn-primario" disabled={enviando}>
        {enviando ? "Creando…" : "Crear usuario"}
      </button>
      <div className="sm:col-span-2 lg:col-span-5">
        <Mensajes estado={estado} />
      </div>
    </form>
  );
}

export function FilaUsuario({
  u,
  esYo,
}: {
  u: { id: number; usuario: string; nombre: string; rol: Rol; activo: boolean };
  esYo: boolean;
}) {
  const [estado, accion, enviando] = useActionState(actualizarUsuario, {});
  return (
    <form action={accion} className="grid gap-3 px-4 py-3 sm:grid-cols-[1.5fr_1fr_auto_1.3fr_auto] sm:items-center">
      <input type="hidden" name="id" value={u.id} />
      <div>
        <div className="font-medium">{u.nombre}</div>
        <div className="text-xs text-muted-foreground">{u.usuario}{esYo && " (vos)"}</div>
      </div>
      <select name="rol" className="input" defaultValue={u.rol} aria-label="Rol" disabled={esYo}>
        <option value="USUARIO">Usuario</option>
        <option value="ADMIN">Admin</option>
      </select>
      {esYo && <input type="hidden" name="rol" value={u.rol} />}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activo" defaultChecked={u.activo} disabled={esYo} />
        Activo
        {esYo && <input type="hidden" name="activo" value="on" />}
      </label>
      <input
        name="password"
        type="password"
        className="input"
        placeholder="Nueva contraseña (opcional)"
        autoComplete="new-password"
        aria-label={`Nueva contraseña para ${u.usuario}`}
      />
      <button className="btn-secundario" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar"}
      </button>
      {(estado.error || estado.ok) && (
        <div className="sm:col-span-5">
          <Mensajes estado={estado} />
        </div>
      )}
    </form>
  );
}

export function FormMiPassword() {
  const [estado, accion, enviando] = useActionState(cambiarMiPassword, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) form.current?.reset();
  }, [estado]);
  return (
    <form ref={form} action={accion} className="space-y-4">
      <div>
        <label className="label" htmlFor="actual">Contraseña actual</label>
        <input id="actual" name="actual" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div>
        <label className="label" htmlFor="nueva">Nueva contraseña</label>
        <input id="nueva" name="nueva" type="password" className="input" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <label className="label" htmlFor="repetir">Repetir nueva contraseña</label>
        <input id="repetir" name="repetir" type="password" className="input" autoComplete="new-password" minLength={8} required />
      </div>
      <Mensajes estado={estado} />
      <button className="btn-primario w-full" disabled={enviando}>
        {enviando ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
