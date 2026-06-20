CREATE INDEX IF NOT EXISTS idx_reservas_estado_fecha_hora
  ON reservas(estado, fecha, hora);

CREATE INDEX IF NOT EXISTS idx_reservas_open_cleanup
  ON reservas(abierto, estado, fecha, hora)
  WHERE abierto = 1 AND estado = 'confirmada';

CREATE INDEX IF NOT EXISTS idx_solicituds_partida_user_estat
  ON solicituds_partida(de_user_id, estat);

CREATE INDEX IF NOT EXISTS idx_solicituds_partida_estat_reserva
  ON solicituds_partida(estat, reserva_id);

CREATE INDEX IF NOT EXISTS idx_amics_user_actives
  ON amics(user_id, amic_id);
