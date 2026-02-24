-- =========================================
-- SUPPRESSION DE TOUTES LES TABLES
-- PROJET HOMESERVICES
-- =========================================

-- Supprimer dans l'ordre inverse des dépendances

DROP TABLE IF EXISTS reviews CASCADE;

DROP TABLE IF EXISTS payments CASCADE;

DROP TABLE IF EXISTS bookings CASCADE;

DROP TABLE IF EXISTS services CASCADE;

DROP TABLE IF EXISTS categories CASCADE;

DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS user_categories CASCADE;

-- (Optionnel) supprimer les types ENUM
DROP TYPE IF EXISTS payment_status CASCADE;

DROP TYPE IF EXISTS booking_status CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;

-- Pourquoi cet ordre ?

-- Parce que :

-- reviews dépend de bookings et users

-- payments dépend de bookings

-- bookings dépend de services et users

-- services dépend de users et categories

-- 👉 On supprime toujours les tables enfants avant les tables parents.

-- Même si tu utilises CASCADE, c’est propre de respecter l’ordre.