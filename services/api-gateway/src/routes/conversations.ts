import type { FastifyInstance } from 'fastify';
import { ConversationSchema } from '@securechat/types';
import { forwardRequest } from '../utils/proxy.js';
import { requireAuth } from '../utils/auth.js';

export const registerConversationRoutes = (server: FastifyInstance) => {
  server.get('/api/v1/conversations', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const query = new URLSearchParams(req.query as Record<string, string>);
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/conversations?${query.toString()}`, token);
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/conversations', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    ConversationSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/conversations`, token);
    return reply.status(statusCode).send(data);
  });

  server.get('/api/v1/conversations/:conversation_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}`, token);
    return reply.status(statusCode).send(data);
  });

  server.put('/api/v1/conversations/:conversation_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    ConversationSchema.partial().parse(req.body);
    const { conversation_id } = req.params as { conversation_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}`, token);
    return reply.status(statusCode).send(data);
  });

  server.delete('/api/v1/conversations/:conversation_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}`, token);
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/conversations/:conversation_id/participants', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}/participants`, token);
    return reply.status(statusCode).send(data);
  });

  server.delete('/api/v1/conversations/:conversation_id/participants/:user_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { conversation_id, user_id } = req.params as { conversation_id: string; user_id: string };
    const { statusCode, data } = await forwardRequest(
      req,
      `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}/participants/${user_id}`,
      token
    );
    return reply.status(statusCode).send(data);
  });

  server.put('/api/v1/conversations/:conversation_id/participants/:user_id/role', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { conversation_id, user_id } = req.params as { conversation_id: string; user_id: string };
    const { statusCode, data } = await forwardRequest(
      req,
      `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}/participants/${user_id}/role`,
      token
    );
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/conversations/:conversation_id/leave', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}/leave`, token);
    return reply.status(statusCode).send(data);
  });
};
