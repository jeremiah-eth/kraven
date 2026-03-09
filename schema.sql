-- ============================================================
-- KRAVEN — Supabase Schema
-- ============================================================
-- These tables are created AUTOMATICALLY on bot startup via
-- CREATE TABLE IF NOT EXISTS in src/db.ts.
--
-- You do NOT need to run this manually unless you want to
-- pre-create the tables or inspect the schema.
-- ============================================================

-- Accounts you are watching for token deployments
CREATE TABLE IF NOT EXISTS watched_accounts (
    id          SERIAL PRIMARY KEY,
    x_handle    TEXT UNIQUE NOT NULL,       -- lowercase X/Twitter handle (no @)
    added_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watched_wallets (
  id              SERIAL PRIMARY KEY,
  x_handle        TEXT NOT NULL REFERENCES watched_accounts(x_handle) ON DELETE CASCADE,
  wallet_address  TEXT NOT NULL,
  source          TEXT, -- e.g. 'Clanker', 'Doppler', 'Bankr', 'Learned'
  discovered_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(x_handle, wallet_address)
);

-- History of every alert that was sent
CREATE TABLE IF NOT EXISTS alert_history (
    id                  SERIAL PRIMARY KEY,
    token_name          TEXT,
    token_symbol        TEXT,
    contract_address    TEXT,
    deployer_x_handle   TEXT,
    platform            TEXT,               -- 'via Bankr' or 'via Clanker'
    clanker_url         TEXT,
    tx_hash             TEXT,
    alerted_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: index for faster lookups by handle
CREATE INDEX IF NOT EXISTS idx_watched_accounts_handle
    ON watched_accounts (x_handle);

CREATE INDEX IF NOT EXISTS idx_alert_history_handle
    ON alert_history (deployer_x_handle);

CREATE INDEX IF NOT EXISTS idx_alert_history_alerted_at
    ON alert_history (alerted_at DESC);

-- ============================================================
-- Access Control
-- ============================================================

CREATE TABLE IF NOT EXISTS access_codes (
    id          SERIAL PRIMARY KEY,
    code        TEXT UNIQUE NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    used_by     TEXT, -- The Telegram Chat ID that consumed this code
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    used_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS authorized_users (
    chat_id         TEXT PRIMARY KEY,
    authorized_at   TIMESTAMPTZ DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ DEFAULT NOW()
);
