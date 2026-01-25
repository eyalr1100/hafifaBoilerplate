# Geospatial Dataset Search API

A TypeScript/Node.js REST API for managing and searching geospatial datasets with PostGIS support.

## Features

- CRUD operations for geospatial products
- Advanced spatial queries (intersection, contains, within)
- Flexible search with numeric ranges and enum filters
- PostgreSQL/PostGIS with TypeORM
- OpenAPI 3.0 specification
- Dependency injection (tsyringe)
- OpenTelemetry tracing and metrics

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14 with PostGIS extension

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
createdb your_database_name
psql -d your_database_name -c "CREATE EXTENSION postgis;"

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

Server runs on `http://localhost:8080`  
API docs available at `http://localhost:8080/docs`

## Configuration

Edit `config/default.json` or set the following environment variables:

| Variable        | Description                    | Default   | Example              |
|-----------------|--------------------------------|-----------|----------------------|
| `DB_HOST`       | PostgreSQL host                 | `localhost` | `localhost`          |
| `DB_PORT`       | PostgreSQL port                 | `5432`      | `5432`               |
| `DB_USER`       | Database user                   | `postgres`  | `postgres`           |
| `DB_PASSWORD`   | Database password               | `postgres`  | `secret`             |
| `DB_NAME`       | Database name                   | —           | `your_database_name` |
| `SERVER_PORT`   | API server port                 | `8080`      | `8080`               |

## API Examples

**Create a product:**
```bash
POST /products
{
  "name": "Satellite Imagery",
  "description": "High resolution raster",
  "type": "raster",
  "protocol": "WMTS",
  "boundingPolygon": {
    "type": "Polygon",
    "coordinates": [[[30,10], [40,40], [20,40], [10,20], [30,10]]]
  },
  "consumtionLink": "https://example.com/wmts",
  "resolutionBest": 0.25,
  "minZoom": 8,
  "maxZoom": 18
}
```

**Search products:**
```bash
POST /products/search
{
  "type": "raster",
  "resolutionBest": { "lessEqual": 1.0 }
}
```

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Clear test cache (if needed)
npx jest --clearCache
```

## Development

```bash
# Lint & format
npm run lint
npm run format:fix

# Generate OpenAPI types (after modifying openapi3.yaml)
npm run generate:openapi-types

# Generate migration
npm run migration:generate -- ./db/migration/YourMigrationName
```

## Deployment

```bash
# Build
npm run build

# Docker
docker build -t dataset-search-api .
docker run -p 8080:8080 -e DB_PASSWORD=secret dataset-search-api

# Kubernetes (Helm)
helm install dataset-search-api ./helm
```

## Project Structure

```
src/
├── common/          # Shared utilities, config, DB connection
├── product/         # Product module (controllers, models, routes)
├── app.ts           # Application factory
└── index.ts         # Entry point

tests/
├── integration/     # Integration tests
└── unit/           # Unit tests
```

## Tech Stack

- **Runtime:** Node.js 20 + TypeScript 5.8
- **Framework:** Express.js
- **Database:** PostgreSQL + PostGIS
- **ORM:** TypeORM
- **Testing:** Jest + SWC
- **API Docs:** OpenAPI 3.0
- **Observability:** OpenTelemetry + Pino logging

## License

ISC
