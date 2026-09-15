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


## Api Reference

| Category | Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- | :--- |

## Tests