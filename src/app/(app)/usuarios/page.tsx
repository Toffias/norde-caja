import { asc } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { FilaUsuario, FormNuevoUsuario } from "@/components/forms-usuarios";
import { requerirAdmin } from "@/lib/auth";

export default async function UsuariosPage() {
  const yo = await requerirAdmin();
  const lista = await db
    .select({
      id: usuarios.id,
      usuario: usuarios.usuario,
      nombre: usuarios.nombre,
      rol: usuarios.rol,
      activo: usuarios.activo,
    })
    .from(usuarios)
    .orderBy(asc(usuarios.nombre));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Usuarios</h1>
      <section className="card p-4">
        <h2 className="mb-4 font-extrabold">Nuevo usuario</h2>
        <FormNuevoUsuario />
      </section>
      <section className="card divide-y divide-line">
        {lista.map((u) => (
          <FilaUsuario key={u.id} u={u} esYo={u.id === yo.id} />
        ))}
      </section>
      <p className="text-xs text-muted-foreground">
        <strong>Admin:</strong> ve y modifica todos los meses, edita y borra movimientos, ve el log y administra
        usuarios. <strong>Usuario:</strong> carga ingresos y egresos del mes vigente y puede anular el último
        movimiento.
      </p>
    </div>
  );
}
