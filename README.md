# DW SWE Assignment

Concert reservation app with a Next.js portal, NestJS API, and PostgreSQL database.

## Setup

```bash
docker compose up
```

- Portal: http://localhost:3000
- API: http://localhost:8080
- PostgreSQL: localhost:5432

The API container runs Drizzle migrations on startup.

## Architecture

```text
portal/  Next.js UI
  -> calls server REST API with axios + TanStack Query

server/  NestJS API
  src/
  ├─ main.ts                 App bootstrap
  ├─ app.module.ts           Root module wiring
  ├─ auth/                   Login, JWT, roles, guards
  │  ├─ dto/                 Auth request/response shapes
  │  ├─ guards/              JWT and role guards
  │  ├─ decorators/          Role metadata decorator
  │  └─ types/               Auth request/JWT payload types
  ├─ users/                  User registration and lookup
  │  └─ dto/                 User input DTOs
  ├─ concerts/               Concert CRUD/read logic
  │  └─ dto/                 Concert input/output DTOs
  ├─ reservations/           Booking and reservation history
  │  └─ dto/                 Reservation response DTOs
  ├─ db/                     Drizzle database module
  │  └─ schema/              Tables: users, concerts, reservations
  ├─ config/                 App and database config
  └─ utils/                  Shared enums/helpers

postgres  PostgreSQL 16 database
```

Runtime flow: browser -> Next.js portal -> NestJS controllers/services/repositories -> PostgreSQL.

## Libraries

- Frontend: Next.js 16, React 19, TanStack Query, axios, Tailwind CSS
- Backend: NestJS 10, Drizzle ORM, PostgreSQL driver, JWT, bcryptjs, class-validator
- Tooling: TypeScript, ESLint, Jest, ts-jest, Docker Compose

## Tests

```bash
# API unit tests
cd server
npm install
npm test

# API coverage
npm run test:cov

# Portal lint check
cd ../portal
npm install
npm run lint
```

## Bonus Tasks

### Performance Optimization

If the dataset becomes massive or traffic slows the site down, I would first identify the bottleneck. Static assets should be served through a CDN to reduce latency and offload traffic. API responses for frequently read data can be cached with short TTLs, while database queries should be reviewed with `EXPLAIN`, proper indexes, pagination, and selective projections. For very large datasets, I would consider table partitioning, read replicas, and moving rarely accessed historical data into archive tables or cold storage.

### Concurrency Control

To prevent over-booking when many users reserve the last seats at the same time, the final protection must be at the database level. The reservation flow should run inside a transaction and use an atomic conditional update, for example:

```sql
UPDATE concerts
SET available_seats = available_seats - 1
WHERE id = $1 AND available_seats > 0;
```

Only requests where the update affects one row should create a reservation. This can be combined with row-level locking or optimistic checks. In a distributed setup, a queue such as Kafka or Redis Streams can route reservation events for the same concert to the same partition so they are processed sequentially, but the database constraint remains the source of truth.
