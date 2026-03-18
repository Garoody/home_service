-- =====================================================================
-- TABLE: payments (ajout des details complementaires de paiement)
-- Cette colonne conserve des informations simples selon le mode choisi :
-- email PayPal, IBAN masque ou confirmation du paiement en especes.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS payment_details jsonb;

COMMENT ON COLUMN public.payments.payment_details IS 'Details complementaires saisis lors du choix du moyen de paiement';
