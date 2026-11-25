-- Small Shop Web AI keys: D1 schema.
-- Apply with: npx wrangler d1 execute small-shop-web-ai --remote --file worker/schema.sql

CREATE TABLE IF NOT EXISTS site_keys (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  key_hash           TEXT NOT NULL UNIQUE,   -- SHA-256 of the key; the key itself is never stored
  key_hint           TEXT NOT NULL,          -- last 4 characters, to tell keys apart
  allowed_origins    TEXT NOT NULL DEFAULT '[]', -- JSON array; empty = server-side use only
  monthly_cap_micros INTEGER,                -- spending cap in millionths of a dollar; NULL = no cap
  active             INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usage (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id             TEXT NOT NULL,
  month              TEXT NOT NULL,          -- YYYY-MM (UTC)
  model              TEXT,
  input_tokens       INTEGER NOT NULL DEFAULT 0,
  output_tokens      INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens  INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  web_searches       INTEGER NOT NULL DEFAULT 0,
  cost_micros        INTEGER NOT NULL,
  request_id         TEXT,
  created_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS usage_key_month ON usage (key_id, month);
