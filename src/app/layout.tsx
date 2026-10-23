import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Caja Norde",
  description: "Caja chica de la oficina: ingresos, egresos y cierres mensuales.",
  robots: { index: false, follow: false },
};

// Aplica el tema guardado (o el del sistema) antes de pintar, para que no parpadee.
const scriptTema = `try{var t=localStorage.getItem("tema");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} ${cinzel.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
