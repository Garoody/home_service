-- =====================================================================
-- DROITS APP_SERVICE
-- Ce script prepare l'utilisateur applicatif pour lancer les migrations
-- depuis Node.js en environnement local Windows/Laragon.
--
-- Il doit etre execute avec le role postgres (ou un role superuser),
-- car l'utilisateur applicatif ne peut pas se donner lui-meme ces droits.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

-- Autorise l'utilisateur applicatif a creer de nouvelles tables dans public.
GRANT USAGE, CREATE ON SCHEMA public TO app_service;

-- Transfere la propriete des tables existantes a l'utilisateur applicatif
-- pour qu'il puisse executer les ALTER TABLE des prochaines migrations.
ALTER TABLE IF EXISTS public.users OWNER TO app_service;
ALTER TABLE IF EXISTS public.categories OWNER TO app_service;
ALTER TABLE IF EXISTS public.services OWNER TO app_service;
ALTER TABLE IF EXISTS public.bookings OWNER TO app_service;
ALTER TABLE IF EXISTS public.payments OWNER TO app_service;
ALTER TABLE IF EXISTS public.reviews OWNER TO app_service;
ALTER TABLE IF EXISTS public.user_sessions OWNER TO app_service;
ALTER TABLE IF EXISTS public.user_categories OWNER TO app_service;
ALTER TABLE IF EXISTS public.saved_payment_methods OWNER TO app_service;

-- Conserve un acces complet au role postgres pour l'administration locale.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
