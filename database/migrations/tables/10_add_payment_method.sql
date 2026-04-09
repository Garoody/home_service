-- =====================================================================
-- TABLE: payments (ajout du mode de paiement)
-- Migration legacy de rattrapage pour une base ancienne.
-- Ne pas rejouer dans une initialisation complete : la table payments
-- contient deja cette colonne dans 05_add_payments_table.sql.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS payment_method varchar(30) NOT NULL DEFAULT 'card';

COMMENT ON COLUMN payments.payment_method IS 'Mode de paiement: card, cash, bank_transfer';
