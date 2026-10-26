# Caja Norde

Caja chica de la oficina de Norde Propiedades: ingresos, egresos, cierre mensual automático, log de anulaciones y exportación a Excel.

Next.js 16 + MySQL (Drizzle ORM). Pensado para el hosting Node.js de Hostinger.

## Roles

- **Admin**: ve y modifica todos los meses (incluidos los cerrados), edita y borra movimientos, ve el log y administra usuarios.
- **Usuario**: carga y edita ingresos y egresos del mes vigente y puede anular el último movimiento del mes. Cada edición y anulación queda en el log.

## Cómo funciona la caja

- Hay dos cajas independientes: **Caja de oficina** y **Caja Osvaldo** (en `src/lib/cajas.ts`). Cada una tiene sus propios movimientos, saldos, cierres y log; todos los usuarios ven las dos. La caja activa va en la URL (`/?caja=osvaldo`), así cada pestaña queda fija en una caja; al entrar sin elegir se abre la última usada. Caja Osvaldo usa una paleta azul para que no se confunda con la de oficina.
- La pantalla principal muestra siempre el mes calendario vigente (hora de Argentina).
- La primera vez que alguien entra en un mes nuevo, los meses anteriores se cierran solos y queda guardada la foto del cierre (saldo inicial, ingresos, egresos, saldo final).
- El saldo inicial de cada mes es el saldo acumulado de todos los meses anteriores.
- Anular o borrar no elimina la fila: la marca como anulada y guarda el detalle en el log. Si un admin modifica un mes cerrado, se recalculan ese cierre y los siguientes.

## Desarrollo local

1. `pnpm install`
2. Copiar `.env.example` a `.env.local` y completar `DATABASE_URL`, `SESSION_SECRET` y los datos del admin.
3. `pnpm db:push` crea las tablas. Volvé a correrlo después de actualizar el código si cambió el esquema (por ejemplo, la columna `sesiones_desde` de `usuarios`, que invalida las sesiones viejas al cambiar la contraseña).
4. `pnpm crear-admin` crea el usuario administrador.
5. (Opcional) `pnpm importar-excel "<ruta>\caja oficina CORREGIDA.xlsm" admin` importa los movimientos de la planilla. Sólo corre con la tabla vacía.
6. `pnpm dev` y abrir http://localhost:3000

Otros comandos: `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Producción (Hostinger)

- Crear la base MySQL en Hostinger y cargar `DATABASE_URL` (host `127.0.0.1`, puerto `3306`) y `SESSION_SECRET` como variables de entorno de la app.
- Build: `pnpm build` · Start: `pnpm start`.
- Correr `pnpm db:push` y `pnpm crear-admin` una vez contra la base de producción.
- Al actualizar a esta versión, correr de nuevo `pnpm db:push` para agregar la columna `usuarios.sesiones_desde`.
- Para la versión con varias cajas, correr una vez `scripts/sql/2026-10-cajas.sql` contra la base **antes** de reiniciar la app. Agrega la columna `caja` (todo lo existente queda en Caja de oficina) y cambia la clave de `cierres` a (caja, periodo).
