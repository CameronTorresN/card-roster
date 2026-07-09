-- Run this once against your Vercel Postgres database
-- (Storage tab -> your database -> Query, or via `vercel env pull` + psql)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT DEFAULT '',
  username      TEXT UNIQUE,
  avatar        TEXT,                -- base64 data URL, small square thumbnail
  theme         TEXT DEFAULT 'dark', -- 'dark' or 'light'
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- If you already ran an earlier version of this schema, run these too:
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

CREATE TABLE IF NOT EXISTS cards (
  id        TEXT PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  num       TEXT,
  player    TEXT NOT NULL,
  team      TEXT,
  tier      TEXT DEFAULT 'Base',
  cond      TEXT DEFAULT 'Mint',
  qty       INTEGER DEFAULT 1,
  value     NUMERIC DEFAULT 0,       -- stored in MXN
  notes     TEXT,
  image     TEXT,                    -- base64 data URL, small/cropped thumbnail
  added_at  BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cards_user ON cards (user_id);
CREATE INDEX IF NOT EXISTS idx_cards_added_at ON cards (added_at DESC);
