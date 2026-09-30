# Safe Way Analytics

An independently hosted analytics dashboard and API backed by PostgreSQL. The dashboard queries the project's Express API directly and has no third-party builder or runtime dependency.

## Stack

- `api/`: TypeScript, Express, PostgreSQL and SQL migrations
- `dashboard/`: React, Vite, Tailwind CSS and Recharts
- `docker-compose.yml`: PostgreSQL, API, and nginx-served dashboard

## Quick start with Docker Compose

1. Copy `.env.example` to `.env` and replace the example PostgreSQL password with a local secret.
2. From the repository root, run `docker compose up --build`.
3. Open the dashboard at <http://localhost:8080>. The API is also available at <http://localhost:4000>; PostgreSQL is exposed locally at port `5433`.
4. Stop the stack with `docker compose down`. To also delete its persistent database, use `docker compose down -v`.

The API container waits for PostgreSQL health, applies pending migrations on startup, and then listens on port `4000` internally. The dashboard's nginx server proxies `/api/*` to the API container and serves client-side routes.

Interactive API documentation is available at <http://localhost:4000/api-docs/> when the API is running; its OpenAPI JSON is at <http://localhost:4000/api-docs/openapi.json>. It includes the current visit and dashboard routes.

## Local development without Docker

Start PostgreSQL and create the database/user configured in the API environment. Then:

```sh
cd api
cp ../.env.example .env
```

Set `POSTGRESQL_CONNECTION_STRING` in `api/.env` to a local connection, for example `postgresql://safeway:your-local-password@localhost:5433/safeway_analytics`, then run `npm ci` and `npm start`.

In another terminal:

```sh
cd dashboard
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` requests to `VITE_API_PROXY_TARGET` (default `http://localhost:4000`). The dashboard build reads `VITE_API_BASE_URL`, which defaults to the same-origin `/api` path.

## Environment variables

Root `.env.example` contains Compose settings:

| Variable | Purpose | Default |
| --- | --- | --- |
| `POSTGRES_USER` | PostgreSQL account | `safeway` |
| `POSTGRES_PASSWORD` | PostgreSQL password — change this | example value |
| `POSTGRES_DB` | Database name | `safeway_analytics` |
| `POSTGRES_PORT` | Host port for PostgreSQL | `5433` |
| `API_PORT` | Host port for the API | `4000` |
| `DASHBOARD_PORT` | Host port for the dashboard | `8080` |
| `NODE_ENV` | API runtime mode | `development` |
| `PINO_LOG_LEVEL` | API logging threshold | `info` |
| `VITE_API_BASE_URL` | Browser API path/base URL | `/api` |

`POSTGRESQL_CONNECTION_STRING` is also shown in the template. Compose constructs the correct internal connection string from the database variables; for local non-Docker API runs use a `localhost` hostname and the host-mapped PostgreSQL port.

Dashboard-specific local settings are documented in `dashboard/.env.example`. Only `VITE_*` values are included in browser assets; never put credentials or private server secrets in dashboard variables.

## API integration

The dashboard currently uses the backend month-range and selected-month endpoints:

- `GET /api/dashboard/get-custom-month-range-data?start_year=YYYY&start_month=M&end_year=YYYY&end_month=M`
- `GET /api/dashboard/get-specific-months-data?months=[{"year":YYYY,"month_number":M}]`

Analytics summary counts and traffic/device/location breakdowns are mapped from the API response. The backend records visits, not general page views, so the dashboard labels this measure **Visits**. Location data currently has labels/counts but no coordinates, so it is displayed as a location ranking instead of a geographic map.

## Authentication and user management status

The current API does not implement login, access tokens, authorization, invitations, or user role updates. The dashboard does not pretend to authenticate users; the Users page explains this limitation and does not call the unprotected user-list routes. The existing user API must not be exposed publicly until authentication/authorization is implemented and password hashes are excluded from all user responses. Keep the dashboard/API on a trusted local or private network in the meantime.

## Checks

```sh
cd dashboard && npm run build
cd ../api && npm test
```
