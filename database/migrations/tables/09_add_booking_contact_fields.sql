-- =====================================================================
-- TABLE: bookings (ajout informations client de reservation)
-- Migration legacy de rattrapage pour une base ancienne.
-- Ne pas rejouer dans une initialisation complete : la table bookings
-- contient deja ces colonnes dans 04_add_bookings_table.sql.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE IF EXISTS bookings
    ADD COLUMN IF NOT EXISTS first_name varchar(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS last_name varchar(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS city varchar(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS address varchar(255) NOT NULL DEFAULT '';

COMMENT ON COLUMN bookings.first_name IS 'Prenom saisi lors de la reservation';
COMMENT ON COLUMN bookings.last_name IS 'Nom saisi lors de la reservation';
COMMENT ON COLUMN bookings.city IS 'Ville d intervention demandee';
COMMENT ON COLUMN bookings.address IS 'Adresse d intervention demandee';
