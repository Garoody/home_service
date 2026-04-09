-- =====================================================================
-- TABLE: service_photos
-- Stocke des photos optionnelles de realisations pour un service.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS public.service_photos (
    id_service_photo uuid PRIMARY KEY DEFAULT uuidv7(),
    service_id uuid NOT NULL REFERENCES public.services(id_service) ON DELETE CASCADE,
    image_path varchar(255) NOT NULL,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_photos_service_id
    ON public.service_photos(service_id);

CREATE INDEX IF NOT EXISTS idx_service_photos_service_order
    ON public.service_photos(service_id, display_order);

COMMENT ON TABLE public.service_photos IS 'Galerie optionnelle de photos de realisations pour chaque service';
COMMENT ON COLUMN public.service_photos.image_path IS 'Chemin public de la photo de realisation';
COMMENT ON COLUMN public.service_photos.display_order IS 'Ordre d affichage des photos pour un service';
