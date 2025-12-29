
## BACKEND & ETL SYSTEM

## Overview
Production-style Backend & ETL system that ingests crypto data from
multiple sources, normalizes it, and exposes a queryable API.

### Components
- ingestion/: Data ingestion pipelines
- schemas/: Validation & normalization
- api/: REST API service
- core/: Shared infrastructure (DB, config)

## API Endpoints
GET /data  
GET /health  

GET /data
Supports pagination and filtering.

Query params:
- limit
- offset
- symbol

GET /health
Checks database connectivity and ETL checkpoint status.

## Dockerization
Prerequisites

- Docker

Environment Setup

Create a local environment file from the example:
- cp .env.example .env 

Linux / macOS
- start system -- make up
- stop system -- make down
- run Tests -- make test

Windows(without make)
- start system -- docker-compose up --build
- stop system -- docker-compose down
- run Tests -- docker-compose run api npm test

starting system: 

- Start PostgreSQL
- Initialize database schema
- Run ETL pipelines automatically
- Start the API server

## Testing

This project includes a minimal but production-grade test suite.

What is tested:

- ETL transformation logic
- API health endpoint
- Failure scenarios
- Schema validation

Command to Run tests
- npm test

## Improved Incremental Ingestion

This system implements production-grade incremental ETL ingestion with strong failure recovery guarantees.

Key Features

1. Checkpoint-based Progress Tracking
- Each ingestion source maintains its own checkpoint in the         etl_checkpoint table.
- The checkpoint stores the last successfully processed record value, not runtime metadata.

2. Resume-on-Failure Logic
If the ETL process crashes or is interrupted mid-run:
- Successfully processed data is preserved
- The next ETL run resumes from the last safe checkpoint
- No data loss occurs

3. Idempotent Writes
All normalized inserts into clean_crypto_prices are protected by:
- Database-level unique constraints : ON CONFLICT DO NOTHING logic

This guarantees that re-running ETL never creates duplicates, even after failures or restarts.

## stats API (ETL Observability)

A dedicated /stats endpoint was implemented to provide visibility into ETL execution.

What it reports:
- Total successful and failed ETL runs
- Timestamp of the most recent run
- Last successful and failed executions
- Total records processed across runs
- Duration of the most recent ETL execution

Why this matters
Enables quick health checks of ETL pipelines

## Automated Testing

A minimal yet meaningful test suite was added to validate system correctness.

Test coverage includes:

- Schema validation tests
- Ensures malformed or invalid data is rejected before ingestion.
- Incremental ingestion tests
- Verifies checkpoint tables exist and ETL progress is tracked correctly.
- API tests
  Confirms API endpoints return expected responses.
- Failure handling tests
  Validates graceful behavior during database or runtime failures.