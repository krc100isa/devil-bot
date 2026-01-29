import type { FastifyInstance } from 'fastify';
import { UpdateUserSchema, PrivacySchema } from '@securechat/types';
import { forwardRequest } from '../utils/proxy.js';
import { requireAuth } from '../utils/auth.js';

export const registerUserRoutes = (server: FastifyInstance) => {
  server.get('/api/v1/users/me', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/users/me`, token);
    return reply.status(statusCode).send(data);
  });

  server.put('/api/v1/users/me', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    UpdateUserSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/users/me`, token);
    return reply.status(statusCode).send(data);
  });

  server.get('/api/v1/users/:user_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { user_id } = req.params as { user_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/users/${user_id}`, token);
    return reply.status(statusCode).send(data);
  });

  server.get('/api/v1/users/search', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const query = new URLSearchParams(req.query as Record<string, string>);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/users/search?${query.toString()}`, token);
    return reply.status(statusCode).send(data);
  });

  server.put('/api/v1/users/me/privacy', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    PrivacySchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/users/me/privacy`, token);
    return reply.status(statusCode).send(data);
  });
};
