-- Varias cajas (OFICINA y OSVALDO). Correr una sola vez, antes de reiniciar la app con el código nuevo.
-- Todo lo que ya existe queda en OFICINA por el DEFAULT de la columna: no se pierde ni se mueve nada.

ALTER TABLE movimientos
  ADD COLUMN caja ENUM('OFICINA', 'OSVALDO') NOT NULL DEFAULT 'OFICINA' AFTER id,
  DROP INDEX movimientos_periodo_idx,
  ADD INDEX movimientos_caja_periodo_idx (caja, periodo, fecha);

-- El cierre pasa a ser por caja y mes.
ALTER TABLE cierres
  ADD COLUMN caja ENUM('OFICINA', 'OSVALDO') NOT NULL DEFAULT 'OFICINA' FIRST,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (caja, periodo);

ALTER TABLE auditoria
  ADD COLUMN caja ENUM('OFICINA', 'OSVALDO') NOT NULL DEFAULT 'OFICINA' AFTER usuario_id;
