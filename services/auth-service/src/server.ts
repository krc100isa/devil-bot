import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { createLogger, createMetricsRegistry } from '@securechat/observability';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { registerAuthRoutes } from './routes/auth.js';
import { registerUserRoutes } from './routes/users.js';
import { registerContactRoutes } from './routes/contacts.js';
import { registerKeyRoutes } from './routes/keys.js';

export const buildServer = async () => {
  const logger = createLogger(process.env.SERVICE_NAME ?? 'auth-service');
  const server = Fastify({ logger });
  const metrics = createMetricsRegistry();

  await server.register(helmet);
  await server.register(cors, { origin: true, credentials: true });
  await server.register(sensible);

  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  server.decorate('prisma', prisma);
  server.decorate('redis', redis);

  server.addHook('onClose', async () => {
    await prisma.$disconnect();
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
  registerKeyRoutes(server);

  return server;
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
  }
}
