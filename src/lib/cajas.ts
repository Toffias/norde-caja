// Las cajas que maneja la app. Cada una lleva sus propios movimientos, cierres y log.
// Los datos anteriores a que hubiera varias cajas son todos de OFICINA (es el default de la columna).
export const CAJAS = ["OFICINA", "OSVALDO"] as const;
export type CajaId = (typeof CAJAS)[number];

export const CAJA_DEFAULT: CajaId = "OFICINA";

export const DATOS_CAJA: Record<CajaId, { slug: string; nombre: string }> = {
  OFICINA: { slug: "oficina", nombre: "Caja de oficina" },
  OSVALDO: { slug: "osvaldo", nombre: "Caja Osvaldo" },
};

/** "osvaldo" -> "OSVALDO"; null si no es una caja conocida. */
export function cajaDeSlug(slug: string | null | undefined): CajaId | null {
  return CAJAS.find((c) => DATOS_CAJA[c].slug === slug) ?? null;
}

export function slugDe(caja: CajaId): string {
  return DATOS_CAJA[caja].slug;
}

export function nombreCaja(caja: CajaId): string {
  return DATOS_CAJA[caja].nombre;
}
