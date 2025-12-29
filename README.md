
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
