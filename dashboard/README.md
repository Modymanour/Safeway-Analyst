# Safe Way Analytics Dashboard

React/Vite dashboard for the local Safe Way analytics API. It can run independently of any third-party builder or hosting platform.

## Development

Install packages, copy `.env.example` to `.env` if you need non-default values, and start Vite:

```sh
npm install
npm run dev
```

The dashboard runs on <http://localhost:5173> and proxies `/api` calls to `VITE_API_PROXY_TARGET` (default `http://localhost:4000`). Set `VITE_API_BASE_URL` only to override the browser API base path; use `/api` for same-origin proxying.

## Production build

```sh
npm run build
npm run preview
```

The container image builds the static bundle and serves it with a small Node static server. That server proxies `/api` requests to `API_PROXY_TARGET` (the Compose setup points it at `http://api:4000`) and serves the client-side dashboard routes. Configure the complete system from the repository root `.env.example` and `docker-compose.yml`.

## Available screens

- Analytics with selectable date periods, summary KPI cards, monthly comparisons, CSV export, traffic sources, devices, and location ranking.
- A sign-in screen for dashboard accounts.
- A protected Users page with paginated account listing; administrators can create user or administrator accounts.

## Authentication and accounts

All dashboard pages require a signed-in account. Sign in with the email address and password provisioned by an administrator. API requests include the short-lived access token as a bearer token. The dashboard keeps the rotating refresh token in browser local storage, uses it to restore a session or renew an expired access token, and signs out through the API before clearing the local session.

Only accounts with the `admin` role see the account-creation form. New passwords must be 8–128 characters and include an uppercase letter, a lowercase letter, a number, and one of `$`, `@`, `#`, or `%`. The API enforces authorization independently of the UI.

The API must be running and its authentication secrets and database configured before sign-in. On startup, the API seeds the first administrator from `ADMIN_EMAIL` and `ADMIN_PASSWORD` if that email is not already present. For production, use strong unique credentials, serve the dashboard and API over HTTPS, and consider moving refresh-token storage to secure, HTTP-only cookies.
