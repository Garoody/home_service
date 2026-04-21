-- ============================================================================
-- ETAPE 3-A : EXTENSIONS ET FONCTIONS PARTAGEES
-- ============================================================================

SET CLIENT_ENCODING TO 'UTF8';

-- Extensions utilisees par HomeServices
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fallback local pour uuidv7().
-- On s'appuie sur gen_random_uuid() afin de garder les migrations compatibles
-- avec l'environnement de developpement actuel.
CREATE OR REPLACE FUNCTION uuidv7()
RETURNS uuid
LANGUAGE sql
AS $function$
  SELECT gen_random_uuid();
$function$;

COMMENT ON FUNCTION uuidv7() IS 'Helper UUID compatible avec les migrations HomeServices.';





