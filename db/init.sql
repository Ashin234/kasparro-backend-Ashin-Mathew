CREATE TABLE raw_coinpaprika (
  id SERIAL PRIMARY KEY,
  payload JSONB,
  fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE raw_csv_crypto (
  id SERIAL PRIMARY KEY,
  payload JSONB,
  fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clean_crypto_prices (
  id SERIAL PRIMARY KEY,
  coin_id TEXT,
  name TEXT,
  symbol TEXT,
  price_usd NUMERIC,
  source TEXT,
  last_updated TIMESTAMP,
  ingested_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (coin_id, source)
);

CREATE TABLE etl_checkpoint (
  source TEXT PRIMARY KEY,
  last_run TIMESTAMP
);