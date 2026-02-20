-- =====================================================================
-- 00_add_extensions_and_helpers.sql
-- Extensions + enums + trigger function
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

-- Extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional: UUID v7 extension (if installed)
-- If your Postgres doesn't have uuidv7(), we provide a fallback below.
DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'uuidv7';
  IF NOT FOUND THEN
    -- Fallback: uuidv7() will behave like gen_random_uuid()
    -- (Not true UUIDv7, but keeps your DDL compatible with the project style.)
    CREATE OR REPLACE FUNCTION uuidv7()
    RETURNS uuid
    LANGUAGE sql
    AS $$ SELECT gen_random_uuid(); $$;
  END IF;
END $$;

-- Enums (HomeServices)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
    CREATE TYPE role_enum AS ENUM ('client','provider','admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
    CREATE TYPE booking_status_enum AS ENUM ('pending','confirmed','completed','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pending','paid');
  END IF;
END $$;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
