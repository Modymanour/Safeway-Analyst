# Safeway Api

A TypeScript/Express backed by Postgresql to store user actions on https://safewaytransportation.it.com to provide web metrics & insights

## Current Status
- Database (no)
- Middleware (no)
- Authentication (no)
- Authorization (no)
- Error handling (no)
- Logging (no)
- CI (no)
- CD (no)
- Routes & Controllers (no)

## Requirements
- Node.js
- npm
- PostgreSQL
- Docker

## Database migrations

The system already applies pending migrations when running using docker compose up;though, on the circumstances where you want to run it without docker, you should run the postgres container with the same configurations as the system and us the following commands:

```bash
npm run db:migrate
```

Show migration status and checksum changes:

```bash
npm run db:migrate:status
```

Migration files are stored in `src/migrations/` and are applied in filename order.

## Project structure

```text
src/
	app.ts                    Express application entry point
	config/                   Environment configuration
	db/                       PostgreSQL pool and migration runner
	migrations/               SQL schema and indexes
	repositories/             Database access modules
	routes/                   Express router
	controllers/              Request handlers
	services/                 Application services
	schemas/		          Zod schema for the APIs
	errors/          	      Specified Errors for the system
    loggers/                  Specified logging system
```

## Database Schema

The database schema can be either seen from the erd diagram of the system in diagrams folder or through the initial & first migration of the system

### Tables

#### `users`

Stores dashboard user accounts.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key|
| `username` | `TEXT` | Required and unique |
| `email` | `TEXT` | Required and unique |
| `password` | `TEXT` | Required |
| `role` | `TEXT` | Required |
| `created_at` | `TIMESTAMP` | Defaults to the current time |
| `updated_at` | `TIMESTAMP` | Defaults to the current time and updates automatically |

#### `refresh_tokens`

Stores refresh tokens associated with users.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key|
| `user_id` | `UUID` | References `users.id`; Cascades |
| `token` | `TEXT` | Required |
| `expires_at` | `TIMESTAMP` | Required expiration time |
| `created_at` | `TIMESTAMP` | Defaults to the current time |
| `updated_at` | `TIMESTAMP` | Defaults to the current time and updates automatically |

#### `password_reset_tokens`

Stores password-reset tokens associated with users.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key |
| `user_id` | `UUID` | References `users.id`; Cascades|
| `token` | `TEXT` | Required |
| `expires_at` | `TIMESTAMP` | Required expiration time |
| `created_at` | `TIMESTAMP` | Defaults to the current time |
| `updated_at` | `TIMESTAMP` | Defaults to the current time and updates automatically |

#### `user_visits_stats`

Stores website visit and interaction statistics.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key|
| `email_click` | `BOOLEAN` | Required |
| `whatsapp_click` | `BOOLEAN` | Required |
| `phone_click` | `BOOLEAN` | Required |
| `time_on_page` | `INTEGER` | Required |
| `device_type` | `TEXT` | Required |
| `traffic_source` | `TrafficSource` | Required enum value |
| `location` | `TEXT` | Required |
| `created_at` | `TIMESTAMP` | Defaults to the current time |

### Enum

`TrafficSource` accepts the following values:

- `organic`
- `paid`
- `referral`
- `social`
- `direct`

## Api Reference

| Category | Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- | :--- |

## Tests

Requirements:

- Vitest
- testcontainers (postgreql)

Currently, there exists 4 test files for the repositories in the system.

### Global configuration

global-setup.ts sets up a Postgresql container and runs system migraitions on it; when a file runs tests, it can extract a pool client from the global setup and run it.

### Setup configuration
setup.ts configures the connection string to be used, import the backend pool module and set types for returning data from Postgres

### Tools
tools.ts contains functions for creating any kind of entities needed in the tests.

### Running Tests
You can run the tests using the already setup script in package.json => test: vitest run

```bash
npm test
```

This will run all the tests in the system