"use client";

import { useRouter } from "next/navigation";

export function SelectorMes({
  periodo,
  opciones,
}: {
  periodo: string;
  opciones: { valor: string; texto: string }[];
}) {
  const router = useRouter();
  return (
    <select
      aria-label="Mes"
      className="input w-auto pr-8 font-medium"
      value={periodo}
      onChange={(e) => router.push(`/?mes=${e.target.value}`)}
    >
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.texto}
        </option>
      ))}
    </select>
  );
}
