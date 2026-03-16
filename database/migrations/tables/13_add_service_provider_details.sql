-- =====================================================================
-- TABLE: services (ajout informations professionnelles detaillees)
-- Cette migration permet de stocker des informations visibles sur la fiche
-- de service : experience, formations, permis et zone d intervention.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS experience_years int,
    ADD COLUMN IF NOT EXISTS trainings text,
    ADD COLUMN IF NOT EXISTS has_driving_license boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS service_area varchar(255);

COMMENT ON COLUMN public.services.experience_years IS 'Nombre d annees d experience affichees pour le service';
COMMENT ON COLUMN public.services.trainings IS 'Formations et certifications liees au service';
COMMENT ON COLUMN public.services.has_driving_license IS 'Indique si le prestataire dispose du permis pour ce service';
COMMENT ON COLUMN public.services.service_area IS 'Zone d intervention du service';
