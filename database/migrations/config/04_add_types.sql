-- ============================================================================
-- ETAPE 3-B : TYPES ENUM UTILISES PAR LES MIGRATIONS ACTIVES
-- ============================================================================

SET CLIENT_ENCODING TO 'UTF8';

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
    CREATE TYPE role_enum AS ENUM (
      'client',
      'provider',
      'admin'
    );
  END IF;
END
$do$;

COMMENT ON TYPE role_enum IS 'Roles HomeServices. client = compte standard, admin = gestion du site, provider conserve pour compatibilite legacy.';

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
    CREATE TYPE booking_status_enum AS ENUM (
      'pending',
      'confirmed',
      'completed',
      'cancelled'
    );
  END IF;
END
$do$;

COMMENT ON TYPE booking_status_enum IS 'Statuts de reservation utilises par la table bookings.';

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM (
      'pending',
      'paid'
    );
  END IF;
END
$do$;

COMMENT ON TYPE payment_status_enum IS 'Statuts de paiement utilises par la table payments.';
