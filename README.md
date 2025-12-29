
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

## Dockerization
Prerequisites

Docker

Docker Compose

Environment Setup

Create a local environment file from the example:

cp .env.example .env 

To start in Linux / macOS use -- make up

To start in Windows (without make) -- docker-compose up --build

This 

Start PostgreSQL

Initialize database schema

Run ETL pipelines automatically

Start the API server

To stop in Linux / macOS -- make down

To stop in Windows -- docker-compose down

To run Tests in Linux / macOS -- make test

To run Tests in Windows -- docker-compose run api npm test