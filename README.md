
### BACKEND & ETL SYSTEM

## Overview
This project is a production-style Backend & ETL system that ingests cryptocurrency data from multiple sources, normalizes it into a unified schema, and exposes a queryable REST API.

The system is designed to demonstrate real-world backend engineering practices, including incremental ETL, idempotent writes, observability, automated testing, and Docker-based deployment.

## Architecture
        Data Sources
  (API / CSV / Third Source) -->
        ETL Pipelines
(Extract • Transform • Load) -->
         PostgreSQL
  (Raw + Clean + Checkpoints) -->
         REST API
   (Express.js Endpoints) -->
           Clients
      (Users / Evaluators)

## Tech Stack

- Node.js (JavaScript) – Runtime used for both ETL pipelines and API services, enabling asynchronous and efficient data processing.

- Express.js – Lightweight web framework for building REST APIs (/data, /health, /stats).

- PostgreSQL – Relational database used for raw data storage, normalized clean tables, - ETL checkpoints, and run metadata.

- Docker & Docker Compose – Containerization and service orchestration for reproducible, one-command system startup.

- Jest – Testing framework used for ETL logic, API endpoints, and failure scenarios.

- Environment Variables (.env) – Secure configuration management for API keys and database credentials.

## Components

- api/: REST API service
- core/: Shared infrastructure (DB, Ckeckpoint)
- data/: csv files
- db/: sql schema
- ingestion/: ETL pipelines for multiple data sources
- schemas/: Unified schema validation and normalization
- tests/: Automated test suite

## Environment Setup

1. Docker installed
2. Create a local environment file from the example:
- cp .env.example .env 
3. Important Commands:
### Linux / macOS
- To start system -- make up
- To stop system -- make down
- To run Tests -- make test

### Windows(without make)
- To start system -- docker compose up --build -d
- To stop system -- docker-compose down
- To run Tests -- docker exec -it backend_api npm test

This:
- Start PostgreSQL
- Initialize database schema
- Run ETL pipelines automatically
- Start the API server

## Steps followed

### 1. Data Ingestion

- 1 API source (API key via env)

- 1 CSV source

- Raw storage (raw_* tables)

- Unified schema with type validation

- Incremental ingestion (no reprocessing)

### 2. Backend API

- GET /data – pagination, filtering, request metadata

- GET /health – DB connectivity & ETL status

### 3. Dockerized System

Runnable via:

- make up
- make down
- make test

- Includes Dockerfile, docker-compose, Makefile, README

- ETL + API start automatically

### 4. Testing

- ETL logic

- API endpoint

- Failure scenario

### 5. Third Data Source(CSV) added and unified

### 6. Incremental ETL

- Checkpoint table

- Resume-on-failure

- Idempotent writes

### 7. Observability

- GET /stats – records, duration, success/failure metadata

### 8. Expanded Testing

- Incremental ingestion

- Failures

- Schema mismatches

- API endpoints

### 9. API Access & Authentication

- All API endpoints(except health) require an API key

- Authentication enforced via request headers

- API keys are securely managed using environment variables / cloud secrets

### Header
- x-api-key: <API_KEY>

### Example Test
- curl -H "x-api-key: my_api_key" http://<url>/data
