import Link from "next/link";
import { salir } from "@/app/acciones/sesion";
import { BotonTema } from "@/components/boton-tema";
import { Marca } from "@/components/marca";
import { Navegacion } from "@/components/navegacion";
import { requerirUsuario } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const yo = await requerirUsuario();
  const esAdmin = yo.rol === "ADMIN";

  const links = [
    { href: "/", texto: "Caja" },
    ...(esAdmin
      ? [
          { href: "/auditoria", texto: "Log de anulaciones" },
          { href: "/usuarios", texto: "Usuarios" },
        ]
      : []),
    { href: "/cuenta", texto: "Mi cuenta" },
  ];

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Inicio">
            <Marca className="h-7 w-auto" />
            <span className="hidden rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              Caja
            </span>
          </Link>
          <Navegacion links={links} />
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-right leading-tight md:block">
              <span className="block font-semibold">{yo.nombre}</span>
              <span className="text-xs text-muted-foreground">{esAdmin ? "Administrador" : "Usuario"}</span>
            </span>
            <BotonTema />
            <form action={salir}>
              <button className="btn-secundario px-4 py-2">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}
