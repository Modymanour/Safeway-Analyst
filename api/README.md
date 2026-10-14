# Safe Way Analytics API

A TypeScript/Express backed by Postgresql to store user actions on https://safewaytransportation.it.com to provide web metrics & insights & discussions for users.

## API documentation

With the API running locally, open Swagger UI at **<http://localhost:4000/api-docs/>** or if its in producion you can open **<https://safewaytransportation.it.com/api-docs/>**. The interactive OpenAPI page documents the visit and dashboard endpoints and lets you try requests. In Docker Compose, use the API host port configured by `API_PORT` (default `4000`), for example <http://localhost:4000/api-docs/>.

The OpenAPI JSON is available at <http://localhost:4000/api-docs/openapi.json>. The specification is configured in `src/config/openapi.ts` and served by Express alongside Swagger UI.

### Documented endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/user-visit` | Record a visit |
| `GET` | `/api/user-visit/get` | List visit records |
| `GET` | `/api/user-visit/search` | Search visit records |
| `GET` | `/api/dashboard/get-current-year-data` | Current year's analytics |
| `GET` | `/api/dashboard/get-current-month-data` | Current month's analytics |
| `GET` | `/api/dashboard/get-custom-month-data` | A selected month's analytics |
| `GET` | `/api/dashboard/get-custom-month-range-data` | A contiguous month range |
| `GET` | `/api/dashboard/get-specific-months-data` | Selected months' analytics |
| `GET` | `/api/dashboard/search-users` | Search dashboard users |
| `GET` | `/api/dashboard/get-all-users` | List dashboard users (authenticated) |
| `POST` | `/api/dashboard/sign-in` | Sign in and obtain access/refresh tokens |
| `POST` | `/api/dashboard/sign-in-with-refresh-token` | Rotate tokens using a refresh token |
| `POST` | `/api/dashboard/sign-out` | Revoke a refresh token |
| `POST` | `/api/dashboard/create-user` | Create a user (admin permission required) |
| `POST` | `/api/dashboard/create-admin` | Create an administrator (admin permission required) |
| `PUT` | `/api/dashboard/change-role` | Change role of a user (used only by admins) |
| `POST` | `/api/dashboard/verification-token` | Create a verification token |
| `POST` | `/api/dashboard/verification-token/confirm` | Confirm a verification token |
| `POST` | `/api/dashboard/password-reset-token` | Create a password token |
| `POST` | `/api/dashboard/password-reset-token/confirm` | Confirm a password token |
| `POST` | `/api/categories/create` | Create Category (for admins only)|
| `PUT` | `/api/categories/update/:id` | Update Category (for admins only)|
| `DELETE` | `/api/categories/delete/:id` | Delete Caegory (for admins only)|
| `GET` | `/api/categories/get-by-name` | Get a Category by name|
| `GET` | `/api/categories/search` | Search for categories based on given search filters |
| `GET` | `/api/categories/get-all` | Get all categories|
| `POST` | `/api/issues/create` | Create Issue|
| `PUT` | `/api/issues/update/:id` | Update Issue (if and only if it belongs to the user, on the case of the admin they by pass the security)|
| `DELETE` | `/api/issues/delete/:id` | Delete Issue (if and only if it belongs to the user, on the case of the admin they by pass the security)|
| `GET` | `/api/issues/get-by-id/:id` | Get Issues by id|
| `GET` | `/api/issues/search` | Search for Issues based on given search filters|
| `GET` | `/api/issues/get-all` | Get all issues|
| `POST` | `/api/issue-comments/create` | Create issue comment|
| `PUT` | `/api/issue-comments/update/:id` | Update Issue comment (if and only if it belongs to the user, on the case of the admin they by pass the security)|
| `DELETE` | `/api/issue-comments/delete/:id` | Delete issue comment (if and only if it belongs to the user, on the case of the admin they by pass the security)|
| `GET` | `/api/issue-comments/get-issue-comment-by-id/:id` | Get issue comment by id|
| `GET` | `/api/issue-comments/search` | Search for Issue comments based on given search parameters|
| `GET` | `/api/issue-comments/get-all` | Get all issue comments|

You can access the schema of the requests for the apis from the swagger page. Moreover, you can head to /src/schem/index.ts to find all the zod schemas that are used to validate the input

## Requirements
- Node.js
- npm
- PostgreSQL
- Docker
- Vite
- Github Actions

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
	middleware/ 			  Contains the authentication, authorization and logging middlewares
	types/					  Defining custom types such as customizing incomming request for authorization
	repositories/             Database access modules
	routes/                   Express router
	controllers/              Request handlers
	services/                 Application services
	schemas/		          Zod schema for the APIs
	lib/					  library folder for helper functions
	lib/errors/          	  Specified Errors for the system
    lib/loggers/              Specified logging system
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
| `verified` | `BOOLEAN` | Required; set by default to false |
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

#### `verification_tokens`

Verfies user account.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key|
| `user_id` | `UUID` | References `users.id`; Cascades |
| `token` | `TEXT` | Required |
| `expires_at` | `TIMESTAMP` | Required expiration time |
| `created_at` | `TIMESTAMP` | Defaults to the current time |
| `updated_at` | `TIMESTAMP` | Defaults to the current time and updates automatically |

#### `categories`

Saves the categories for the issue service.

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key|
| `slug` | `TEXT` | Required |
| `name` | `TEXT` | Required |
| `color` | `VARCHAR(7)` | Required and maximum of 7 chars |
| `description` | `TEXT` | |	
| `created_at` | `TIMESTAMP` | Defaults to the current time |
| `updated_at` | `TIMESTAMP` | Defaults to the current time and updates automatically |

#### `issues`

Entity for the issues of the dashboard

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key|
| `title` | `VARCHAR(200)` | Required |
| `created_by` | `UUID` | References users(id); Set to Null |
| `category_id` | `UUID` | References categories(id) ; Restrict|
| `status` | `TEXT` | must be in ('open', 'planned', 'in_progress', 'completed', 'closed') |
| `priority` | `SMALLINT` | between 1 -> 5; 1 lowest & 5 highest |
| `description` | `TEXT` | |	
| `created_at` | `TIMESTAMP` | Defaults to the current time |
| `updated_at` | `TIMESTAMP` | Defaults to the current time and updates automatically |

#### `issue_comments`

Entity for the issues of the dashboard

| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key|
| `author_id` | `UUID` | References users(id); Set to Null |
| `issue_id` | `UUID` | References issues(id) ; Restrict|
| `body` | `TEXT` | Required |	
| `edited` | `BOOLEAN` | Required; set to false |
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

You could also run unit tests only using

```bash
npm test:unit
```

This testing approach uses the vitest.unit.config.ts rather than the vitest.config.ts