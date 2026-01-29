import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import Redis from 'ioredis';
import { createLogger, createMetricsRegistry } from '@securechat/observability';
import { registerAuthRoutes } from './routes/auth.js';
import { registerUserRoutes } from './routes/users.js';
import { registerContactRoutes } from './routes/contacts.js';
import { registerConversationRoutes } from './routes/conversations.js';
import { registerMessageRoutes } from './routes/messages.js';
import { registerMediaRoutes } from './routes/media.js';
import { registerCallRoutes } from './routes/calls.js';

export const buildServer = async () => {
  const logger = createLogger(process.env.SERVICE_NAME ?? 'api-gateway');
  const server = Fastify({ logger });
  const metrics = createMetricsRegistry();

  await server.register(helmet);
  await server.register(cors, { origin: true, credentials: true });
  await server.register(sensible);

  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  server.decorate('redis', redis);

  await server.register(rateLimit, {
    redis,
    max: Number(process.env.RATE_LIMIT_MAX ?? 120),
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW ?? 60) * 1000
  });

  server.addHook('onClose', async () => {
    await redis.quit();
  });

  server.get('/healthz', async () => ({ status: 'ok' }));
  server.get('/readyz', async () => ({ status: 'ready' }));
  server.get('/metrics', async (_req, reply) => {
    reply.type('text/plain');
    return metrics.metrics();
  });

  registerAuthRoutes(server);
  registerUserRoutes(server);
  registerContactRoutes(server);
  registerConversationRoutes(server);
  registerMessageRoutes(server);
  registerMediaRoutes(server);
  registerCallRoutes(server);

  return server;
};

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}
