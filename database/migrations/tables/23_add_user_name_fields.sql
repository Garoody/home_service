-- =====================================================================
-- USERS: separate first and last names
-- =====================================================================
-- This incremental migration keeps full_name for backward compatibility:
-- existing views, searches and historical records still rely on it.

SET CLIENT_ENCODING TO 'UTF8';

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name varchar(75);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_name varchar(75);

-- Only split legacy values that contain at least two parts. A one-word
-- legacy value cannot be separated reliably, so it remains unchanged.
UPDATE public.users
SET
  first_name = split_part(btrim(full_name), ' ', 1),
  last_name = NULLIF(
    btrim(regexp_replace(btrim(full_name), '^[^[:space:]]+[[:space:]]*', '')),
    ''
  )
WHERE first_name IS NULL
  AND last_name IS NULL
  AND btrim(COALESCE(full_name, '')) ~ '[[:space:]]+';

COMMENT ON COLUMN public.users.first_name IS 'Prénom de l''utilisateur';
COMMENT ON COLUMN public.users.last_name IS 'Nom de famille de l''utilisateur';
COMMENT ON COLUMN public.users.full_name IS 'Nom complet conservé pour la compatibilité et construit à partir du prénom et du nom pour les nouveaux comptes';

COMMIT;
