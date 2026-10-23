import type { SVGProps } from "react";

function Icono(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
      {...props}
    />
  );
}

export const IconoMas = () => (
  <Icono>
    <path d="M12 5v14M5 12h14" />
  </Icono>
);
export const IconoMenos = () => (
  <Icono>
    <path d="M5 12h14" />
  </Icono>
);
export const IconoDeshacer = () => (
  <Icono>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icono>
);
export const IconoDescarga = () => (
  <Icono>
    <path d="M12 15V3M7 10l5 5 5-5M5 21h14" />
  </Icono>
);
export const IconoLapiz = () => (
  <Icono>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icono>
);
export const IconoCerrar = () => (
  <Icono>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icono>
);
export const IconoSol = () => (
  <Icono>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icono>
);
export const IconoLuna = () => (
  <Icono>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Icono>
);
