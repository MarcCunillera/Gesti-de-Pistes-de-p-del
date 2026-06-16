DROP INDEX IF EXISTS idx_reservas_fecha_hora_estado;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_fecha_hora_confirmada
  ON reservas(fecha, hora)
  WHERE estado = 'confirmada';

CREATE INDEX IF NOT EXISTS idx_reservas_user_fecha_estado
  ON reservas(user_id, fecha, estado);

CREATE INDEX IF NOT EXISTS idx_reserva_jugadores_user
  ON reserva_jugadores(user_id);

CREATE INDEX IF NOT EXISTS idx_solicituds_partida_reserva_estat
  ON solicituds_partida(reserva_id, estat);

CREATE INDEX IF NOT EXISTS idx_solicituds_amic_rebudes
  ON solicituds_amic(a_user_id, estat, created_at);

