-- =====================================================================
-- TABLE: reviews
-- Ajout de la reponse publique du prestataire sous un avis client.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS provider_reply text,
  ADD COLUMN IF NOT EXISTS provider_reply_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_reply_updated_at timestamptz;

COMMENT ON COLUMN public.reviews.provider_reply IS 'Reponse publique du prestataire a un avis client';
COMMENT ON COLUMN public.reviews.provider_reply_created_at IS 'Date de premiere publication de la reponse du prestataire';
COMMENT ON COLUMN public.reviews.provider_reply_updated_at IS 'Date de derniere mise a jour de la reponse du prestataire';
