-- =====================================================================
-- TABLE: users (ajout chemin photo de profil)
-- Cette colonne permet d'afficher la photo du prestataire
-- sur la fiche service et sur son profil public.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS profile_photo_path varchar(255);

COMMENT ON COLUMN public.users.profile_photo_path IS 'Chemin public vers la photo de profil du prestataire';
