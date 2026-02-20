-- =========================================
-- HomeServices - migration.sql (PostgreSQL)
-- SQL simple, prêt pour un projet Node.js
-- =========================================

BEGIN;

-- 1) Types ENUM
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'provider', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;




-- 2) updated_at automatique
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- 3) Table users
CREATE TABLE IF NOT EXISTS users (
  id                BIGSERIAL PRIMARY KEY,
  full_name         VARCHAR(150) NOT NULL,
  email             VARCHAR(150) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  phone             VARCHAR(20),
  address           TEXT,
  role              user_role NOT NULL DEFAULT 'client',

  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gdpr_consent_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4) Table categories
CREATE TABLE IF NOT EXISTS categories (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5) Table services
CREATE TABLE IF NOT EXISTS services (
  id          BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_services_provider
    FOREIGN KEY (provider_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_services_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);



DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION set_updated_at();





-- 6) Table bookings
CREATE TABLE IF NOT EXISTS bookings (
  id           BIGSERIAL PRIMARY KEY,
  client_id    BIGINT NOT NULL,
  service_id   BIGINT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status       booking_status NOT NULL DEFAULT 'pending',
  total_price  NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_bookings_client
    FOREIGN KEY (client_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_bookings_service
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);



DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7) Table payments (optionnelle)
CREATE TABLE IF NOT EXISTS payments (
  id             BIGSERIAL PRIMARY KEY,
  booking_id     BIGINT NOT NULL UNIQUE,
  amount         NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_date   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);



DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 8) Table reviews
CREATE TABLE IF NOT EXISTS reviews (
  id          BIGSERIAL PRIMARY KEY,
  booking_id  BIGINT NOT NULL UNIQUE,
  client_id   BIGINT NOT NULL,
  provider_id BIGINT NOT NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_reviews_client
    FOREIGN KEY (client_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_reviews_provider
    FOREIGN KEY (provider_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;
CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9) Index
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);

COMMIT;
