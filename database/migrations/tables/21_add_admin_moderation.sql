-- =====================================================================
-- ADMIN MODERATION
-- Colonnes et tables dediees a la moderation admin.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS warning_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS can_message boolean NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS can_publish_services boolean NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_by_admin_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_note text;

COMMENT ON COLUMN public.users.warning_count IS 'Nombre total d avertissements admin';
COMMENT ON COLUMN public.users.suspended_at IS 'Date de suspension du compte par l admin';
COMMENT ON COLUMN public.users.banned_at IS 'Date de bannissement du compte par l admin';
COMMENT ON COLUMN public.users.can_message IS 'Autorisation d envoyer des messages';
COMMENT ON COLUMN public.users.can_publish_services IS 'Autorisation de publier ou modifier des services';
COMMENT ON COLUMN public.users.deleted_by_admin_at IS 'Suppression logique du compte par un admin';

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS admin_status varchar(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS admin_status_reason text,
  ADD COLUMN IF NOT EXISTS admin_status_updated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_services_admin_status'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT chk_services_admin_status
      CHECK (admin_status IN ('active', 'suspended', 'deleted'));
  END IF;
END $$;

COMMENT ON COLUMN public.services.admin_status IS 'Etat de moderation admin du service';
COMMENT ON COLUMN public.services.admin_status_reason IS 'Motif de moderation du service';

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS hidden_by_admin boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_hidden_reason text,
  ADD COLUMN IF NOT EXISTS deleted_by_admin_at timestamptz;

COMMENT ON COLUMN public.reviews.hidden_by_admin IS 'Masquage public de l avis par un admin';
COMMENT ON COLUMN public.reviews.admin_hidden_reason IS 'Motif de masquage admin';
COMMENT ON COLUMN public.reviews.deleted_by_admin_at IS 'Suppression logique admin de l avis';

CREATE TABLE IF NOT EXISTS public.admin_user_warnings (
  id_admin_warning uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.users(id_user) ON DELETE RESTRICT,
  warning_level varchar(30) NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_user_warnings_user
  ON public.admin_user_warnings(user_id, created_at DESC);

COMMENT ON TABLE public.admin_user_warnings IS 'Historique des avertissements admin envoyes aux utilisateurs';

CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id_admin_action uuid PRIMARY KEY DEFAULT uuidv7(),
  admin_id uuid NOT NULL REFERENCES public.users(id_user) ON DELETE RESTRICT,
  action_type varchar(60) NOT NULL,
  target_type varchar(40) NOT NULL,
  target_id text NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at
  ON public.admin_action_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target
  ON public.admin_action_logs(target_type, target_id);

COMMENT ON TABLE public.admin_action_logs IS 'Journal d actions admin pour moderation et lecture sensible';
