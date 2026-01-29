import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { createLogger, createMetricsRegistry } from '@securechat/observability';
import Redis from 'ioredis';
import { MongoClient } from 'mongodb';
import { registerCallRoutes } from './routes/calls.js';
import { startCallWorker } from './worker.js';

export const buildServer = async () => {
  const logger = createLogger(process.env.SERVICE_NAME ?? 'call-service');
  const server = Fastify({ logger });
  const metrics = createMetricsRegistry();

  await server.register(helmet);
  await server.register(cors, { origin: true, credentials: true });
  await server.register(sensible);

  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  const mongo = new MongoClient(process.env.MONGODB_URL ?? 'mongodb://localhost:27017/securechat');
  await mongo.connect();

  server.decorate('redis', redis);
  server.decorate('mongo', mongo);

  server.addHook('onClose', async () => {
    await redis.quit();
    await mongo.close();
  });

  server.get('/healthz', async () => ({ status: 'ok' }));
  server.get('/readyz', async () => ({ status: 'ready' }));
  server.get('/metrics', async (_req, reply) => {
    reply.type('text/plain');
    return metrics.metrics();
  });

  registerCallRoutes(server);
  startCallWorker(server);

  return server;
};

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
    mongo: MongoClient;
  }
}
