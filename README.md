# SecureChat (Jan 2026 Spec)

## Overview
SecureChat is a production-grade, end-to-end encrypted messaging platform with a multi-service backend architecture (API Gateway, Auth, WebSocket, Message, Call, Notification). It uses PostgreSQL, MongoDB, Redis, and S3-compatible storage (MinIO) with event-driven messaging and real-time delivery.

## Repository Layout
- `services/*`: microservices
- `shared/*`: shared config, observability, crypto, and types
- `infra/docker-compose.yml`: local dev stack
- `docs/`: API, WebSocket, and crypto formats

## Local Development

1) Start infra services:
```bash
docker compose -f infra/docker-compose.yml up -d postgres mongo redis minio
```

2) Run migrations:
```bash
./scripts/migrate.sh
```

3) Start services:
```bash
npm install
npm run dev
```

## Service Ports
- API Gateway: `4000`
- Auth Service: `4001`
- Message Service: `4002`
- Call Service: `4003`
- WebSocket Gateway: `5000`

## Health Checks
Each service exposes `/healthz` and `/readyz`.

## Security Notes
- TLS termination is assumed at the edge/load balancer.
- JWT uses RS256; rotate by replacing key pairs and `JWT_KID`.
- Redis keys store OTP throttles, session presence, and stream events.

## Tests
- Crypto unit tests: `npm --workspace @securechat/crypto test`
