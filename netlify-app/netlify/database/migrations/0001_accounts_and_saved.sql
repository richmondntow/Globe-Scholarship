CREATE TABLE auth_users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false, image TEXT,
  created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL, ip_address TEXT, user_agent TEXT
);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE TABLE auth_accounts (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL, provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  access_token TEXT, refresh_token TEXT, id_token TEXT,
  access_token_expires_at TIMESTAMPTZ, refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT, password TEXT, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_auth_accounts_user_id ON auth_accounts(user_id);
CREATE UNIQUE INDEX idx_auth_accounts_provider_account ON auth_accounts(provider_id,account_id);
CREATE TABLE auth_verifications (
  id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_auth_verifications_identifier ON auth_verifications(identifier);
CREATE TABLE auth_rate_limits (
  id TEXT PRIMARY KEY, key TEXT NOT NULL UNIQUE, count INTEGER NOT NULL, last_request BIGINT NOT NULL
);
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, nationality TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '', field TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL
);
CREATE TABLE saved_scholarships (
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  scholarship_id TEXT NOT NULL, saved_at TEXT NOT NULL,
  PRIMARY KEY(user_id,scholarship_id)
);
