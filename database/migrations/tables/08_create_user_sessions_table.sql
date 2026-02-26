-- =====================================================================
-- TABLE: user_sessions
-- (connect-pg-simple) - stockage des sessions Express dans PostgreSQL
-- Ma Postgres doit avoir cette table, sinon les sessions ne peuvent pas être stockées.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS user_sessions (
    sid varchar NOT NULL,
    sess json NOT NULL,
    expire timestamptz NOT NULL,
    CONSTRAINT user_sessions_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);

COMMENT ON TABLE user_sessions IS 'Sessions Express (connect-pg-simple)';