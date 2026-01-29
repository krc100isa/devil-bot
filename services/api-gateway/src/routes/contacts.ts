import type { FastifyInstance } from 'fastify';
import { ContactSchema, ContactUpdateSchema } from '@securechat/types';
import { forwardRequest } from '../utils/proxy.js';
import { requireAuth } from '../utils/auth.js';

export const registerContactRoutes = (server: FastifyInstance) => {
  server.get('/api/v1/contacts', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/contacts`, token);
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/contacts', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    ContactSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/contacts`, token);
    return reply.status(statusCode).send(data);
  });

  server.put('/api/v1/contacts/:contact_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    ContactUpdateSchema.parse(req.body);
    const { contact_id } = req.params as { contact_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/contacts/${contact_id}`, token);
    return reply.status(statusCode).send(data);
  });

  server.delete('/api/v1/contacts/:contact_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { contact_id } = req.params as { contact_id: string };
    const query = new URLSearchParams(req.query as Record<string, string>);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/contacts/${contact_id}?${query.toString()}`, token);
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/contacts/sync', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/contacts/sync`, token);
    return reply.status(statusCode).send(data);
  });
};
