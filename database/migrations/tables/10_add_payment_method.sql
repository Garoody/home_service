-- =====================================================================
-- TABLE: payments (ajout du mode de paiement)
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE IF EXISTS payments
  ADD COLUMN IF NOT EXISTS payment_method varchar(30) NOT NULL DEFAULT 'card';

COMMENT ON COLUMN payments.payment_method IS 'Mode de paiement: card, cash, bank_transfer';
