-- =========================
-- RAW DATA (ALL SOURCES)
-- =========================
CREATE TABLE IF NOT EXISTS raw_crypto (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- CLEAN UNIFIED TABLE
-- =========================
CREATE TABLE IF NOT EXISTS clean_crypto_prices (
  id SERIAL PRIMARY KEY,
  coin_id TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  price_usd NUMERIC NOT NULL,
  source TEXT NOT NULL,
  last_updated TIMESTAMP NOT NULL,
  ingested_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (coin_id, source, last_updated)
);

-- =========================
-- ETL CHECKPOINTS
-- =========================
CREATE TABLE IF NOT EXISTS etl_checkpoint (
  source TEXT PRIMARY KEY,
  last_run TIMESTAMP,
  status TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ETL STATUS
-- =========================

CREATE TABLE IF NOT EXISTS etl_runs (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL,          -- running | success | failed
  records_processed INTEGER DEFAULT 0,
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  duration_ms INTEGER,
  error_message TEXT
);
