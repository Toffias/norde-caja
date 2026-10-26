import { NextResponse, type NextRequest } from "next/server";
import { CAJA_DEFAULT, cajaDeSlug, slugDe } from "@/lib/cajas";

// Chequeo rápido: sin cookie de sesión no se entra. La validación real (firma, usuario activo, rol)
// se hace en cada página, acción y ruta de API.
export function proxy(req: NextRequest) {
  const tieneSesion = req.cookies.has("caja_sesion");
  if (!tieneSesion && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // La caja siempre va en la URL, así cada pestaña muestra (y carga en) una caja fija.
  // Sin ?caja= se vuelve a la última que se usó, recordada en una cookie.
  if (req.nextUrl.pathname === "/") {
    const pedida = cajaDeSlug(req.nextUrl.searchParams.get("caja"));
    if (!pedida && req.method === "GET") {
      const url = req.nextUrl.clone();
      url.searchParams.set("caja", slugDe(cajaDeSlug(req.cookies.get("caja_activa")?.value) ?? CAJA_DEFAULT));
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    if (pedida)
      res.cookies.set("caja_activa", slugDe(pedida), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  return NextResponse.next();
}

export const config = {
  // Fuera del chequeo: API (valida por su cuenta), archivos de Next y estáticos como el favicon o el logo.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|ico|jpg|webp)$).*)"],
};
