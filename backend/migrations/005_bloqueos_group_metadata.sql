ALTER TABLE bloqueados
  ADD COLUMN IF NOT EXISTS group_id TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS fecha_inicio DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin DATE,
  ADD COLUMN IF NOT EXISTS dias_semana TEXT,
  ADD COLUMN IF NOT EXISTS horas TEXT;

UPDATE bloqueados
SET
  group_id = COALESCE(group_id, 'bloqueo-' || id::text),
  fecha_inicio = COALESCE(fecha_inicio, fecha),
  fecha_fin = COALESCE(fecha_fin, fecha),
  dias_semana = COALESCE(dias_semana, EXTRACT(DOW FROM fecha)::int::text),
  horas = COALESCE(horas, to_char(hora, 'HH24:MI'))
WHERE group_id IS NULL
   OR fecha_inicio IS NULL
   OR fecha_fin IS NULL
   OR dias_semana IS NULL
   OR horas IS NULL;

CREATE INDEX IF NOT EXISTS idx_bloqueados_group_id ON bloqueados(group_id);
