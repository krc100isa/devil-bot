# Casino Growth & Operations Platform

Production-grade, modular, scalable SaaS for casino operators focusing on **risk signals**, **early warning**, and **operational control**. This repository uses a monorepo layout with service boundaries per module.

## Monorepo Structure

```
backend/        # FastAPI + Celery + PostgreSQL + Redis
frontend/       # Next.js (App Router) + Tailwind + shadcn/ui
telegram-bot/   # python-telegram-bot ops center
infra/          # Docker Compose (dev + prod) and deployment helpers
```

## Architecture (Written Diagram)

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Task Breakdown

See [`docs/TASK_BREAKDOWN.md`](docs/TASK_BREAKDOWN.md).

## Quick Start (Development)

1. Copy env templates and fill values:
   ```bash
   cp infra/.env.example infra/.env
   ```
2. Start dev stack:
   ```bash
   docker compose -f infra/docker-compose.dev.yml up --build
   ```
3. API docs: `http://localhost:8000/docs`
4. Frontend: `http://localhost:3000`

## Production Notes

- Use `infra/docker-compose.prod.yml` with proper secrets.
- Configure alert routing (Telegram + email) and monitoring.
- Ensure domain/SSL checks run with scheduled Celery beat.

## Status

This repository is at the **initial production-quality scaffolding** phase. Core auth/RBAC, org isolation, and alerting pipelines are next.
