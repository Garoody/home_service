-- =====================================================================
-- TABLE: admin_reports
-- Signalements internes admin sur comptes, services, avis, paiements
-- ou conversations. Utilise pour le suivi simple des problemes.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS public.admin_reports (
  id_admin_report uuid PRIMARY KEY DEFAULT uuidv7(),
  created_by_admin_id uuid NOT NULL REFERENCES public.users(id_user) ON DELETE RESTRICT,
  assigned_admin_id uuid REFERENCES public.users(id_user) ON DELETE SET NULL,
  target_type varchar(40) NOT NULL,
  target_id text NOT NULL,
  title varchar(180) NOT NULL,
  description text NOT NULL,
  priority varchar(20) NOT NULL DEFAULT 'moyenne',
  status varchar(20) NOT NULL DEFAULT 'ouvert',
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz,
  resolved_at timestamptz,
  CONSTRAINT chk_admin_reports_priority
    CHECK (priority IN ('faible', 'moyenne', 'urgente')),
  CONSTRAINT chk_admin_reports_status
    CHECK (status IN ('ouvert', 'en_cours', 'resolu'))
);

DROP TRIGGER IF EXISTS set_timestamp_admin_reports ON public.admin_reports;
CREATE TRIGGER set_timestamp_admin_reports
BEFORE UPDATE ON public.admin_reports
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_admin_reports_status_priority
  ON public.admin_reports(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_reports_target
  ON public.admin_reports(target_type, target_id);

COMMENT ON TABLE public.admin_reports IS 'Signalements internes crees et suivis par les administrateurs';
COMMENT ON COLUMN public.admin_reports.target_type IS 'Type d element signale: user, service, review, booking, payment, conversation';
COMMENT ON COLUMN public.admin_reports.target_id IS 'Identifiant textuel de l element signale';
COMMENT ON COLUMN public.admin_reports.priority IS 'Niveau de priorite du signalement';
COMMENT ON COLUMN public.admin_reports.status IS 'Etat du traitement admin';
