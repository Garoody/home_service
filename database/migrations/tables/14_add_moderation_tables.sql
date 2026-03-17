-- =====================================================================
-- MODERATION HOME SERVICE
-- Cette migration ajoute le socle d'administration post-publication :
-- - statut de compte utilisateur
-- - signalements
-- - avertissements
-- - historique des actions admin
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

-- Statut du compte utilisateur.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS account_status varchar(20) NOT NULL DEFAULT 'active';

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status_reason text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS warning_count int NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_users_account_status'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT chk_users_account_status
    CHECK (account_status IN ('active', 'suspended', 'banned'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_warning_count ON public.users(warning_count);

COMMENT ON COLUMN public.users.account_status IS 'Etat du compte : active, suspended ou banned';
COMMENT ON COLUMN public.users.warning_count IS 'Nombre total d avertissements recus par l utilisateur';

-- Signalements envoyes par les utilisateurs apres publication.
CREATE TABLE IF NOT EXISTS public.reports (
  id_report uuid DEFAULT uuidv7() PRIMARY KEY,
  reporter_id uuid NOT NULL,
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  reason varchar(100) NOT NULL,
  details text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES public.users(id_user) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES public.users(id_user) ON DELETE SET NULL,
  CONSTRAINT chk_reports_target_type CHECK (target_type IN ('service', 'review', 'user')),
  CONSTRAINT chk_reports_status CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  CONSTRAINT uq_reports_unique_target_by_user UNIQUE (reporter_id, target_type, target_id)
);

CREATE TRIGGER set_timestamp_reports
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);

COMMENT ON TABLE public.reports IS 'Signalements de contenus ou utilisateurs apres publication';

-- Avertissements envoyes par l administration.
CREATE TABLE IF NOT EXISTS public.warnings (
  id_warning uuid DEFAULT uuidv7() PRIMARY KEY,
  user_id uuid NOT NULL,
  admin_id uuid,
  report_id uuid,
  message text NOT NULL,
  sanction_applied varchar(40) NOT NULL DEFAULT 'alert',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_warnings_user FOREIGN KEY (user_id) REFERENCES public.users(id_user) ON DELETE CASCADE,
  CONSTRAINT fk_warnings_admin FOREIGN KEY (admin_id) REFERENCES public.users(id_user) ON DELETE SET NULL,
  CONSTRAINT fk_warnings_report FOREIGN KEY (report_id) REFERENCES public.reports(id_report) ON DELETE SET NULL,
  CONSTRAINT chk_warnings_sanction CHECK (
    sanction_applied IN ('alert', 'restriction', 'temporary_suspension', 'ban')
  )
);

CREATE INDEX IF NOT EXISTS idx_warnings_user ON public.warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_report ON public.warnings(report_id);

COMMENT ON TABLE public.warnings IS 'Historique des avertissements admin envoyes aux utilisateurs';

-- Logs d actions admin pour garder une trace de moderation.
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id_log uuid DEFAULT uuidv7() PRIMARY KEY,
  admin_id uuid,
  action_type varchar(40) NOT NULL,
  target_type varchar(20) NOT NULL,
  target_id uuid,
  details text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_logs_admin FOREIGN KEY (admin_id) REFERENCES public.users(id_user) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin ON public.admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target ON public.admin_action_logs(target_type, target_id);

COMMENT ON TABLE public.admin_action_logs IS 'Trace des actions de moderation realisees par les admins';
