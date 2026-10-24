/**
 * Convierte lo que escribe el usuario en un monto: acepta "125000", "125.000", "125.000,50" o "$ 125.000".
 * Devuelve null si no es un número positivo válido.
 */
export function leerMonto(texto: string): number | null {
  let s = texto.replace(/[$\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) {
    // Formato argentino: punto de miles, coma decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n < 1e12 ? n : null;
}

export type EstadoForm = { error?: string; ok?: string };

/** Redondea a centavos para que las sumas de decimales no arrastren errores de punto flotante. */
export function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}
