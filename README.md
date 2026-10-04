# Safe Way Analytics

An independently hosted analytics dashboard and API backed by PostgreSQL. The dashboard queries the project's Express API directly and has no third-party builder or runtime dependency.

## Stack

- `api/`: TypeScript, Express, PostgreSQL and SQL migrations
- `dashboard/`: React, Vite, Tailwind CSS and Recharts
- `docker-compose.yml`: PostgreSQL, API, and a static dashboard server

## Quick start with Docker Compose

1. Copy `.env.example` to `.env` and replace the example PostgreSQL password with a local secret.
2. From the repository root, run `docker compose up --build`.
3. Open the dashboard at <http://localhost:8080/dashboard/>. The API is also available at <http://localhost:4000>; PostgreSQL is exposed locally at port `5432` by default.
4. Stop the stack with `docker compose down`. To also delete its persistent database, use `docker compose down -v`.

The API container waits for PostgreSQL health, connects to the Compose database by service name (`db:5432`), applies pending migrations on startup, and then listens on port `4000` internally. PostgreSQL credentials are passed as separate connection fields, so passwords do not need to be URL-encoded. The dashboard container serves the built static files with a small Node HTTP server on port `4173`; Compose publishes it on `127.0.0.1:8080` by default. There is no nginx container or API proxy inside the dashboard. Caddy routes `/dashboard/*` to the dashboard and `/api/*` directly to the API.

### Using Caddy on the server

Caddy handles public HTTP/HTTPS and routes each request directly to its matching Compose service. For Caddy installed directly on the host, add these handlers inside the existing site block. Preserve the path prefixes; do not use `handle_path` or a URI rewrite for these routes. Leave the existing website handlers after these dashboard/API handlers:

```caddyfile
safewaytransportation.it.com {
	@dashboard path /dashboard /dashboard/*
	handle @dashboard {
		reverse_proxy 127.0.0.1:8080
	}
	@analytics_api path /api/*
	handle @analytics_api {
		reverse_proxy 127.0.0.1:4000
	}
	# Keep the existing website's handlers/catch-all here.
}
```

The API routes already use `/api`, and the dashboard routes/assets use `/dashboard`, so these handlers preserve the paths and Caddy proxies each request only once. If the main site already owns `/api/*`, configure a distinct API path in both the dashboard build and Caddy before deployment.

If Caddy itself runs in Docker, attach it to this Compose project's network and proxy to `dashboard:4173` and `api:4000` instead. Do not use `localhost` from inside the Caddy container; there, localhost refers to Caddy itself. After changing Compose settings, recreate the services with `docker compose up -d --build`.

Interactive API documentation is available at <http://localhost:4000/api-docs/> when the API is running; its OpenAPI JSON is at <http://localhost:4000/api-docs/openapi.json>. It documents the visit, analytics, and account-management routes.

## Local development without Docker

Start PostgreSQL and create the database/user configured in the API environment. Then:

```sh
cd api
cp ../.env.example .env
```

Set `POSTGRESQL_CONNECTION_STRING` in `api/.env` to a local connection, for example `postgresql://safeway:your-local-password@localhost:5432/safeway_analytics`, then run `npm ci` and `npm start`.

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
| `POSTGRES_PORT` | Host port for PostgreSQL | `5432` |
| `API_PORT` | Host port for the API | `4000` |
| `DASHBOARD_PORT` | Host port for the dashboard | `8080` |
| `NODE_ENV` | API runtime mode | `development` |
| `PINO_LOG_LEVEL` | API logging threshold | `info` |
| `VITE_API_BASE_URL` | Browser API path/base URL | `/api` |

`POSTGRESQL_CONNECTION_STRING` is an optional fallback for local/test API runs. Compose uses `POSTGRES_HOST=db` and the individual database credentials; for a local non-Docker API run, use a `localhost` hostname and the host-mapped PostgreSQL port in the connection string.

Dashboard-specific local settings are documented in `dashboard/.env.example`. Only `VITE_*` values are included in browser assets; never put credentials or private server secrets in dashboard variables.

## API integration

The dashboard currently uses the backend month-range and selected-month endpoints:

- `GET /api/dashboard/get-custom-month-range-data?start_year=YYYY&start_month=M&end_year=YYYY&end_month=M`
- `GET /api/dashboard/get-specific-months-data?months=[{"year":YYYY,"month_number":M}]`

Analytics summary counts and traffic/device/location breakdowns are mapped from the API response. The backend records visits, not general page views, so the dashboard labels this measure **Visits**. Location data currently has labels/counts but no coordinates, so it is displayed as a location ranking instead of a geographic map.

## Authentication and user management

The dashboard signs in through the API and sends an access bearer token to protected analytics and account-management routes. Refresh tokens are used to renew sessions. Seed the first administrator with `cd api && npm run db:seed-admin`; administrators can create dashboard accounts, change account roles, and delete any account. Regular users can view the dashboard and delete only their own account. Password hashes are excluded from user-list responses.

Account-management routes:

| Method | Route | Access and behavior |
| --- | --- | --- |
| `POST` | `/api/dashboard/sign-in` | Public sign in with `{ "email", "password" }`; returns access and refresh tokens. |
| `POST` | `/api/dashboard/sign-in-with-refresh-token` | Public token refresh using a JSON body containing `refresh_token`. |
| `POST` | `/api/dashboard/sign-out` | Invalidates the supplied refresh token. |
| `GET` | `/api/dashboard/get-all-users?page=1&pageNumber=10` | Authenticated users with read permission; returns paginated accounts without password hashes. |
| `POST` | `/api/dashboard/create-user` | Admin only; creates a regular dashboard user. |
| `POST` | `/api/dashboard/create-admin` | Admin only; creates another administrator. |
| `PUT` | `/api/dashboard/change-role?user_id=<uuid>&role=user` or `role=admin` | Admin only; changes a user’s role. |
| `GET` | `/api/dashboard/delete-user` | Authenticated user deletes their own account. An admin may pass `user_id=<uuid>` to delete another account; regular users cannot use that parameter to target someone else. |

Protected requests use `Authorization: Bearer <access_token>`. Login and account-management behavior is also described in the interactive OpenAPI documentation.

## Checks

```sh
cd dashboard && npm run build
cd ../api && npm test
```
