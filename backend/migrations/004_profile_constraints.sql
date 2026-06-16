DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_avatar_color_format'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_avatar_color_format
      CHECK (avatar_color IS NULL OR avatar_color ~ '^#[0-9A-Fa-f]{6}$')
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_lado_allowed'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_lado_allowed
      CHECK (lado IS NULL OR lado IN ('derecha', 'reves', 'ambos'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_mano_allowed'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_mano_allowed
      CHECK (mano IS NULL OR mano IN ('diestro', 'zurdo'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_telefono_format'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_telefono_format
      CHECK (telefono IS NULL OR telefono ~ '^[0-9+\s().-]{0,24}$')
      NOT VALID;
  END IF;
END $$;

