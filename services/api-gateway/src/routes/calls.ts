import type { FastifyInstance } from 'fastify';
import { forwardRequest } from '../utils/proxy.js';
import { requireAuth } from '../utils/auth.js';

export const registerCallRoutes = (server: FastifyInstance) => {
  server.get('/api/v1/calls', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const query = new URLSearchParams(req.query as Record<string, string>);
    const { statusCode, data } = await forwardRequest(req, `${process.env.CALL_SERVICE_URL}/calls?${query.toString()}`, token);
    return reply.status(statusCode).send(data);
  });

  server.get('/api/v1/calls/:call_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { call_id } = req.params as { call_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.CALL_SERVICE_URL}/calls/${call_id}`, token);
    return reply.status(statusCode).send(data);
  });

  server.delete('/api/v1/calls/:call_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { call_id } = req.params as { call_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.CALL_SERVICE_URL}/calls/${call_id}`, token);
    return reply.status(statusCode).send(data);
  });
};
