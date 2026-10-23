"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navegacion({ links }: { links: { href: string; texto: string }[] }) {
  const ruta = usePathname();
  return (
    <nav className="order-last flex w-full gap-1 overflow-x-auto text-sm font-semibold sm:order-none sm:w-auto">
      {links.map((l) => {
        const activo = l.href === "/" ? ruta === "/" : ruta.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 transition ${
              activo ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.texto}
          </Link>
        );
      })}
    </nav>
  );
}
