// Fechas y períodos (AAAA-MM) siempre en hora de Argentina, sin depender de la zona del servidor.
const ZONA = "America/Argentina/Buenos_Aires";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Fecha de hoy en Argentina, formato AAAA-MM-DD. */
export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

export function periodoActual(): string {
  return hoy().slice(0, 7);
}

export function periodoDe(fecha: string): string {
  return fecha.slice(0, 7);
}

export function esPeriodo(valor: string | undefined | null): valor is string {
  return !!valor && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
}

export function esFecha(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

export function siguientePeriodo(periodo: string): string {
  const [a, m] = periodo.split("-").map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
}

export function nombrePeriodo(periodo: string): string {
  const [a, m] = periodo.split("-").map(Number);
  return `${MESES[m - 1]} ${a}`;
}

export function primerDia(periodo: string): string {
  return `${periodo}-01`;
}

export function ultimoDia(periodo: string): string {
  const [a, m] = periodo.split("-").map(Number);
  const dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return `${periodo}-${String(dias).padStart(2, "0")}`;
}

/** 2026-10-23 -> 23/10/2026 */
export function fechaCorta(fecha: string): string {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}

export function fechaHora(valor: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA,
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

const formatoPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function pesos(n: number): string {
  return formatoPesos.format(n);
}
