import { redirect } from "next/navigation";
import { BotonTema } from "@/components/boton-tema";
import { Marca } from "@/components/marca";
import { usuarioActual } from "@/lib/auth";
import { FormLogin } from "./form-login";

export default async function LoginPage() {
  if (await usuarioActual()) redirect("/");
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-16">
      <div className="absolute right-4 top-4">
        <BotonTema />
      </div>
      <div className="card w-full max-w-sm p-8 shadow-xl shadow-black/5">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Marca className="h-auto w-56" />
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Caja
          </span>
        </div>
        <FormLogin />
      </div>
    </main>
  );
}
