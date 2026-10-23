import {
  boolean,
  char,
  date,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const ROLES = ["ADMIN", "USUARIO"] as const;
export type Rol = (typeof ROLES)[number];

export const TIPOS = ["INGRESO", "EGRESO"] as const;
export type Tipo = (typeof TIPOS)[number];

export const usuarios = mysqlTable("usuarios", {
  id: int("id").autoincrement().primaryKey(),
  usuario: varchar("usuario", { length: 50 }).notNull().unique(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  rol: mysqlEnum("rol", ROLES).notNull().default("USUARIO"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

// Un movimiento de caja. `periodo` (AAAA-MM) se deriva de `fecha` y agrupa por mes.
// Anular / borrar no elimina la fila: la marca con anulado_en y queda en la auditoría.
export const movimientos = mysqlTable(
  "movimientos",
  {
    id: int("id").autoincrement().primaryKey(),
    fecha: date("fecha", { mode: "string" }).notNull(),
    periodo: char("periodo", { length: 7 }).notNull(),
    tipo: mysqlEnum("tipo", TIPOS).notNull(),
    monto: decimal("monto", { precision: 14, scale: 2, mode: "number" }).notNull(),
    concepto: varchar("concepto", { length: 255 }).notNull(),
    observaciones: varchar("observaciones", { length: 500 }),
    creadoPor: int("creado_por").notNull(),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
    anuladoEn: timestamp("anulado_en"),
    anuladoPor: int("anulado_por"),
  },
  (t) => [index("movimientos_periodo_idx").on(t.periodo, t.fecha)],
);

// Foto de cada mes al cerrarse. cerrado_por NULL = cierre automático al empezar el mes siguiente.
export const cierres = mysqlTable("cierres", {
  periodo: char("periodo", { length: 7 }).primaryKey(),
  saldoInicial: decimal("saldo_inicial", { precision: 14, scale: 2, mode: "number" }).notNull(),
  ingresos: decimal("ingresos", { precision: 14, scale: 2, mode: "number" }).notNull(),
  egresos: decimal("egresos", { precision: 14, scale: 2, mode: "number" }).notNull(),
  saldoFinal: decimal("saldo_final", { precision: 14, scale: 2, mode: "number" }).notNull(),
  cerradoEn: timestamp("cerrado_en").notNull().defaultNow(),
  cerradoPor: int("cerrado_por"),
});

export const ACCIONES = ["ANULAR", "BORRAR", "EDITAR", "CREAR_MES_CERRADO", "CERRAR_MES"] as const;
export type Accion = (typeof ACCIONES)[number];

export const auditoria = mysqlTable(
  "auditoria",
  {
    id: int("id").autoincrement().primaryKey(),
    fecha: timestamp("fecha").notNull().defaultNow(),
    usuarioId: int("usuario_id"),
    accion: mysqlEnum("accion", ACCIONES).notNull(),
    movimientoId: int("movimiento_id"),
    periodo: char("periodo", { length: 7 }),
    detalle: json("detalle"),
  },
  (t) => [index("auditoria_fecha_idx").on(t.fecha)],
);

export type Usuario = typeof usuarios.$inferSelect;
export type Movimiento = typeof movimientos.$inferSelect;
export type Cierre = typeof cierres.$inferSelect;
