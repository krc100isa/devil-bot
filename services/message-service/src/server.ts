import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { createLogger, createMetricsRegistry } from '@securechat/observability';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';
import { registerConversationRoutes } from './routes/conversations.js';
import { registerMessageRoutes } from './routes/messages.js';
import { registerMediaRoutes } from './routes/media.js';

export const buildServer = async () => {
  const logger = createLogger(process.env.SERVICE_NAME ?? 'message-service');
  const server = Fastify({ logger });
  const metrics = createMetricsRegistry();

  await server.register(helmet);
  await server.register(cors, { origin: true, credentials: true });
  await server.register(sensible);

  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  const mongo = new MongoClient(process.env.MONGODB_URL ?? 'mongodb://localhost:27017/securechat');
  await mongo.connect();

  server.decorate('prisma', prisma);
  server.decorate('redis', redis);
  server.decorate('mongo', mongo);

  server.addHook('onClose', async () => {
    await prisma.$disconnect();
    await redis.quit();
    await mongo.close();
  });

  server.get('/healthz', async () => ({ status: 'ok' }));
  server.get('/readyz', async () => ({ status: 'ready' }));
  server.get('/metrics', async (_req, reply) => {
    reply.type('text/plain');
    return metrics.metrics();
  });

  registerConversationRoutes(server);
  registerMessageRoutes(server);
  registerMediaRoutes(server);

  return server;
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    mongo: MongoClient;
  }
}
