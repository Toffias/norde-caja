import { FormMiPassword } from "@/components/forms-usuarios";
import { requerirUsuario } from "@/lib/auth";

export default async function CuentaPage() {
  const yo = await requerirUsuario();
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          {yo.nombre} · {yo.usuario}
        </p>
      </div>
      <section className="card p-4">
        <FormMiPassword />
      </section>
    </div>
  );
}
