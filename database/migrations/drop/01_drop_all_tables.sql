-- =========================================
-- SUPPRESSION DE TOUTES LES TABLES
-- PROJET HOMESERVICES
-- =========================================

-- Supprimer dans l'ordre inverse des dependances
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS saved_payment_methods CASCADE;
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS booking_conversations CASCADE;
DROP TABLE IF EXISTS service_photos CASCADE;
DROP TABLE IF EXISTS user_categories CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Pourquoi cet ordre ?
-- user_sessions et saved_payment_methods peuvent rester apres une init partielle
-- reviews depend de bookings et users
-- payments depend de bookings
-- bookings depend de services et users
-- services dependent de users et categories
-- On supprime toujours les tables enfants avant les tables parentes.
