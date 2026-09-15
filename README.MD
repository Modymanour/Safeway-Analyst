# Safeway Dashboard

Dashboard hosted on https://safewaytransportation.it.com/dashboard for querying and finding insights from the user actions performed on the safway page.

## Current Status
- API (no)
- Dashboard (no)

## Run with Docker Compose
The docker compose files containes 3 services:
- db (Postgres)
- api (Typescript/Express)
- dashboard (to be chosen)

The db needs the following environment vars:
```bash
POSTGRES_USER
POSTGRES_DB
POSTGRES_PASSWORD
```

The api needs the following environment vars:
```bash
CONNECTION_STRING
PORT
```

The dashboard needs the following environment vars:
```bash
```

when running using docker compose, you will need to push the env file with the run command

```bash
docker compose --env-file (wherever the file is) up 
```

The API container listens on `http://localhost:4000`. PostgreSQL is exposed on port `5433` but can be accessed directly in the docker compose through `5432`.

The API runs pending migrations before starting.

Install dependencies and run the service:

```bash
npm install
npm start
```
Thought the service will return error since it needs postgres to be running.