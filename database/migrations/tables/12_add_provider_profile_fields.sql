-- =====================================================================
-- TABLE: users (ajout infos profil prestataire)
-- Cette migration ajoute des champs utiles au profil public / dashboard
-- du prestataire : experience, formations, permis et zone d'intervention.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS experience_years int,
    ADD COLUMN IF NOT EXISTS trainings text,
    ADD COLUMN IF NOT EXISTS has_driving_license boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS service_area varchar(255);

COMMENT ON COLUMN public.users.experience_years IS 'Nombre d annees d experience du prestataire';
COMMENT ON COLUMN public.users.trainings IS 'Formations suivies par le prestataire';
COMMENT ON COLUMN public.users.has_driving_license IS 'Indique si le prestataire possede le permis de conduire';
COMMENT ON COLUMN public.users.service_area IS 'Zone d intervention du prestataire';
