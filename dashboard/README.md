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

The container image builds the static bundle and serves it with nginx. Nginx forwards `/api/` to the Compose API service and falls back to `index.html` for client-side routes. Configure the complete system from the repository root `.env.example` and `docker-compose.yml`.

## Available screens

- Analytics with selectable date periods, summary KPI cards, monthly comparisons, CSV export, traffic sources, devices, and location ranking.
- A Users information page that describes backend auth/user-management prerequisites. No unsupported or insecure user-management calls are made.
