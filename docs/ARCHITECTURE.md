# Architecture Diagram (Written)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Casino Ops SaaS                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐       ┌─────────────────────────────┐       ┌───────────┐  │
│  │  Frontend    │<----->│        API Gateway          │<----->│ PostgreSQL│  │
│  │  Next.js     │       │      FastAPI (async)        │       │  (org DB) │  │
│  └──────┬───────┘       └───────────────┬─────────────┘       └───────────┘  │
│         │                               │                                     │
│         │                               │                                     │
│         │                               │                                     │
│  ┌──────▼───────┐               ┌───────▼────────┐                            │
│  │ Telegram Bot │<--------------│  Alert Router  │-----> Email/SMS/Webhooks   │
│  │ python-telegram-bot           │  (Celery)     │                            │
│  └──────────────┘               └───────┬────────┘                            │
│                                         │                                     │
│                           ┌─────────────▼─────────────┐                       │
│                           │    Scheduler (Celery)     │                       │
│                           │  uptime/ssl/whois/seo     │                       │
│                           └─────────────┬─────────────┘                       │
│                                         │                                     │
│                         ┌───────────────▼───────────────┐                     │
│                         │          Redis Queue          │                     │
│                         └───────────────────────────────┘                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Key Principles

- **Org-scoped hard isolation**: every query includes `organization_id`.
- **Strict RBAC**: OWNER, ADMIN, OPERATOR, ANALYST.
- **Operational control**: incident grouping, alert acknowledgement, escalation.
- **Risk signal language**: avoid spam/black-hat; focus on early warning.
- **Production-grade observability**: structured logs, audit trails, metrics.

## Module Boundaries

1. **Social Media Intelligence**
   - Post history ingestion
   - Content queue (draft → review → approved → scheduled)
   - Hashtag risk signal heuristics

2. **Website & Domain Intelligence**
   - Site uptime/SSL checks
   - WHOIS diffs and history
   - Alert rules (down, expiry, change)

3. **SEO Intelligence (White-hat)**
   - On-page checks for user-provided URLs only
   - Actionable findings with severity

4. **Telegram Ops & Team Control**
   - Inline keyboard flows
   - Ack/resolve alerts
   - Shift system and KPI summary
