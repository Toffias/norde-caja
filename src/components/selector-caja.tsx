import Link from "next/link";
import { CAJAS, nombreCaja, slugDe, type CajaId } from "@/lib/cajas";

/** Encabezado de la caja: nombre bien grande de la caja activa y botones para pasar a la otra. */
export function SelectorCaja({ caja }: { caja: CajaId }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border-2 border-brand bg-brand/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="size-4 shrink-0 rounded-full bg-brand" aria-hidden />
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Estás en la</p>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-brand sm:text-3xl">
            {nombreCaja(caja)}
          </h1>
        </div>
      </div>
      <nav className="flex w-full gap-1 rounded-lg bg-card p-1 sm:ml-auto sm:w-auto" aria-label="Cambiar de caja">
        {CAJAS.map((c) => {
          const activa = c === caja;
          return (
            <Link
              key={c}
              href={`/?caja=${slugDe(c)}`}
              aria-current={activa ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-bold transition sm:flex-none ${
                activa ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {!activa && (
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: `var(--caja-${slugDe(c)})` }}
                  aria-hidden
                />
              )}
              {nombreCaja(c)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
