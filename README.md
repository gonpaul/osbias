# Osbias — Cognitive Journal

A full-stack cognitive journaling web app that helps people become **better thinkers** through AI-powered journaling, bias detection, idea validation, and structured thinking frameworks.

Built with **Next.js 15**, **TypeScript**, **SQLite** (via Knex), **Redux Toolkit**, **CodeMirror**, and **next-intl** for i18n (EN/RU).

## Setup

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 10

### Install & Run

```bash
pnpm install
pnpm run db:migrate
pnpm run seed:dev
pnpm run dev         # http://localhost:9001
```

The app runs on port **9001** by default.

### Database

```bash
pnpm run db:migrate          # run migrations
pnpm run db:rollback         # rollback last migration
pnpm run seed:dev            # seed admin user (admin@osbias.local / Admin1234!)
pnpm run db:backup           # backup SQLite DB
pnpm run db:migrate:safe     # backup + migrate
```

### Known Issue: `better-sqlite3` Native Build

On some systems (especially after Node.js upgrades), the `better-sqlite3` native module may fail with:

```
Could not locate the bindings file. Tried: ...
```

**Fix:**

```bash
pnpm rebuild better-sqlite3
```

If that fails, ensure build tools are installed:

```bash
# Arch Linux
sudo pacman -S base-devel python3

# Then rebuild
pnpm rebuild better-sqlite3
```

As a last resort, force reinstall:

```bash
rm -rf node_modules
pnpm install
```

## Testing

### E2E Tests (Playwright)

Requires a **running dev server** on port 3001:

```bash
# Terminal 1: start server on port 3001
pnpm run dev -- --port 3001

# Terminal 2: run tests
pnpm run test:e2e
```

Or run a single test file:

```bash
pnpx playwright test tests/e2e/auth.spec.ts --reporter=list
```

### DB Relationship Tests

```bash
pnpm run test:db
```

## Deployment

### Build

```bash
pnpm run build
pnpm run start          # production server (port 3000)
```

### Environment Variables

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret for JWT signing (default: `dev-secret`) |
| `NEXT_PUBLIC_BASE_URL` | Public base URL for OG tags |

### Quick Deploy (systemd)

```ini
[Unit]
Description=Osbias Cognitive Journal
After=network.target

[Service]
WorkingDirectory=/path/to/osbias-main
ExecStart=/usr/bin/node .next/standalone/server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker (optional)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm i -g pnpm && pnpm install && pnpm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Database | SQLite 3 (better-sqlite3 via Knex ORM) |
| State | Redux Toolkit |
| Editor | CodeMirror 6 |
| i18n | next-intl (EN / RU) |
| Auth | JWT (cookie-based) |
| Styling | Tailwind CSS 4 |
| Testing | Playwright (E2E) |
| AI | OpenAI / Claude / OpenRouter (pluggable) |
