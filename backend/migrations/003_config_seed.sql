INSERT INTO config (key, value) VALUES
  ('horaInicio', '08:00'),
  ('horaFin', '23:00'),
  ('duracion', '90'),
  ('diasVista', '7'),
  ('maxReservas', '3')
ON CONFLICT (key) DO NOTHING;

