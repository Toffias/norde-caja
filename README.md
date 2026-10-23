# Caja Norde

Caja chica de la oficina de Norde Propiedades: ingresos, egresos, cierre mensual automático, log de anulaciones y exportación a Excel.

Next.js 16 + MySQL (Drizzle ORM). Pensado para el hosting Node.js de Hostinger.

## Roles

- **Admin**: ve y modifica todos los meses (incluidos los cerrados), edita y borra movimientos, ve el log y administra usuarios.
- **Usuario**: carga ingresos y egresos del mes vigente y puede anular el último movimiento del mes. Cada anulación queda en el log.

## Cómo funciona la caja

- La pantalla principal muestra siempre el mes calendario vigente (hora de Argentina).
- La primera vez que alguien entra en un mes nuevo, los meses anteriores se cierran solos y queda guardada la foto del cierre (saldo inicial, ingresos, egresos, saldo final).
- El saldo inicial de cada mes es el saldo acumulado de todos los meses anteriores.
- Anular o borrar no elimina la fila: la marca como anulada y guarda el detalle en el log. Si un admin modifica un mes cerrado, se recalculan ese cierre y los siguientes.

## Desarrollo local

1. `pnpm install`
2. Copiar `.env.example` a `.env.local` y completar `DATABASE_URL`, `SESSION_SECRET` y los datos del admin.
3. `pnpm db:push` crea las tablas.
4. `pnpm crear-admin` crea el usuario administrador.
5. (Opcional) `pnpm importar-excel "<ruta>\caja oficina CORREGIDA.xlsm" admin` importa los movimientos de la planilla. Sólo corre con la tabla vacía.
6. `pnpm dev` y abrir http://localhost:3000

Otros comandos: `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Producción (Hostinger)

- Crear la base MySQL en Hostinger y cargar `DATABASE_URL` (host `127.0.0.1`, puerto `3306`) y `SESSION_SECRET` como variables de entorno de la app.
- Build: `pnpm build` · Start: `pnpm start`.
- Correr `pnpm db:push` y `pnpm crear-admin` una vez contra la base de producción.
