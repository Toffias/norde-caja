"use client";

import { useRouter } from "next/navigation";
import { Desplegable, type Opcion } from "./desplegable";

export function SelectorMes({ caja, periodo, opciones }: { caja: string; periodo: string; opciones: Opcion[] }) {
  const router = useRouter();
  return (
    <Desplegable
      etiqueta="Mes"
      className="w-60"
      opciones={opciones}
      valor={periodo}
      onCambio={(v) => router.push(`/?caja=${caja}&mes=${v}`)}
    />
  );
}
