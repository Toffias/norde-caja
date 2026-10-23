"use client";

import { useRouter } from "next/navigation";
import { Desplegable, type Opcion } from "./desplegable";

export function SelectorMes({ periodo, opciones }: { periodo: string; opciones: Opcion[] }) {
  const router = useRouter();
  return (
    <Desplegable
      etiqueta="Mes"
      className="w-60"
      opciones={opciones}
      valor={periodo}
      onCambio={(v) => router.push(`/?mes=${v}`)}
    />
  );
}
