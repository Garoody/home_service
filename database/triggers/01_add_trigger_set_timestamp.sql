-- ============================================================================
--  TODO ÉTAPE 4 : FONCTION TRIGGER : Mise à jour automatique de updated_at

-- Pour ne plus jamais oublier de mettre à jour la colonne updated_at
-- Fonction trigger_set_timestamp a utiliser sur les tables avec une colonne updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;

$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_set_timestamp () IS 'Met à jour automatiquement la colonne updated_at lors d une modification de ligne';