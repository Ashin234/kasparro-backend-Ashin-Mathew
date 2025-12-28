
## Backend & ETL System

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

