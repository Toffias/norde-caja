import { NextResponse, type NextRequest } from "next/server";

// Chequeo rápido: sin cookie de sesión no se entra. La validación real (firma, usuario activo, rol)
// se hace en cada página, acción y ruta de API.
export function proxy(req: NextRequest) {
  const tieneSesion = req.cookies.has("caja_sesion");
  if (!tieneSesion && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  // Fuera del chequeo: API (valida por su cuenta), archivos de Next y estáticos como el favicon o el logo.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|ico|jpg|webp)$).*)"],
};
