-- =========================================
-- SUPPRESSION DE TOUS LES TYPES (ENUM)
-- PROJET HOMESERVICES
-- =========================================

DROP TYPE IF EXISTS payment_status CASCADE;

DROP TYPE IF EXISTS booking_status CASCADE;

DROP TYPE IF EXISTS role_enum CASCADE;

DROP TYPE IF EXISTS auth_provider_enum CASCADE;

ADD

-- Pourquoi cet ordre ?

-- Même logique que pour les tables :

-- payment_status est utilisé dans payments

-- booking_status est utilisé dans bookings

-- user_role est utilisé dans users

-- On les supprime proprement avec CASCADE.