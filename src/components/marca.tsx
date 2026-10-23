import Image from "next/image";
import logo from "../../public/logo-norde.png";
import logoOscuro from "../../public/logo-norde-oscuro.png";

/** Logo de Norde Propiedades; en modo oscuro usa la versión con letras claras. */
export function Marca({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <>
      <Image src={logo} alt="Norde Propiedades" className={`${className} dark:hidden`} priority />
      <Image src={logoOscuro} alt="Norde Propiedades" className={`${className} hidden dark:block`} priority />
    </>
  );
}
