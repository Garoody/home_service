-- =====================================================================
-- TABLE: users + services (ajout statut du prestataire)
-- Cette migration ajoute un champ simple pour indiquer si le prestataire
-- est un particulier, une entreprise, un artisan, etc.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS provider_status varchar(80);

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS provider_status varchar(80);

COMMENT ON COLUMN public.users.provider_status IS 'Statut declare du prestataire sur son profil public';
COMMENT ON COLUMN public.services.provider_status IS 'Statut declare du prestataire pour ce service';
