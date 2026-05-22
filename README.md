# DW SWE Assignment 

## Setup

```bash
docker compose up --build
```

- Portal: http://localhost:3000
- API: http://localhost:8080/api/v1
- PostgreSQL: localhost:5432

The API container runs Drizzle migrations on startup. Docker Compose waits for PostgreSQL to become healthy, then starts the API, waits for the API healthcheck, and finally starts the portal.

### Environment Variables

Server variables are listed in `server/.env.example`:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET` required
- `JWT_EXPIRES_IN`
- `AUTH_COOKIE_NAME`
- `CORS_ORIGINS`
- `BCRYPT_SALT_ROUNDS`

Portal variables are listed in `portal/.env.example`:

- `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:8080/api/v1`


## Architecture

```text
portal/  Next.js UI
  -> calls server REST API with axios + TanStack Query

server/  NestJS API
  src/
  ├─ main.ts                 App bootstrap, /api/v1 prefix, security headers
  ├─ app.module.ts           Root module wiring
  ├─ auth/                   Login, JWT, roles, guards, login throttling
  │  ├─ dto/                 Auth request/response shapes
  │  ├─ guards/              JWT, role, and login throttle guards
  │  ├─ decorators/          Role metadata decorator
  │  └─ types/               Auth request/JWT payload types
  ├─ users/                  User registration and lookup
  │  └─ dto/                 User input DTOs
  ├─ concerts/               Concert CRUD/read logic with pagination
  │  └─ dto/                 Concert input/output DTOs
  ├─ reservations/           Booking, cancellation, personal/admin history
  │  └─ dto/                 Reservation response DTOs
  ├─ health/                 API healthcheck
  ├─ common/                 Shared pagination, errors, filters
  ├─ db/                     Drizzle database module
  │  └─ schema/              Tables: users, concerts, reservations
  ├─ config/                 App and database config
  └─ utils/                  Shared enums/helpers

postgres  PostgreSQL 16 database
```

## Libraries

- Frontend: Next.js 16, React 19, TanStack Query, axios, Tailwind CSS
- Backend: NestJS 10, Drizzle ORM, PostgreSQL driver, JWT, bcryptjs, class-validator
- Tooling: TypeScript, Jest, ts-jest, Docker Compose, GitHub Actions

## Tests

```bash
# API unit tests
cd server
npm install
npm test

# API coverage
npm run test:cov

# API lint/build
npm run lint
npm run build

# Portal lint/build
cd ../portal
npm install
npm run lint
npm run build
```

CI runs server lint/tests and portal lint/build on push and pull request.

## Docker And Migrations

The server image runs as the non-root `node` user and starts with:

```bash
npm run db:migrate:prod && node dist/main.js
```

The portal image also runs as the non-root `node` user and serves the Next.js standalone build.

Database data is persisted in the `postgres_data` volume. To reset the app:

```bash
docker compose down -v
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
