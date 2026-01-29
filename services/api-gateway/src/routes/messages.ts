import type { FastifyInstance } from 'fastify';
import { MessageSendSchema, MessageReadSchema, MessageReactionSchema } from '@securechat/types';
import { forwardRequest } from '../utils/proxy.js';
import { requireAuth } from '../utils/auth.js';

export const registerMessageRoutes = (server: FastifyInstance) => {
  server.get('/api/v1/conversations/:conversation_id/messages', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const query = new URLSearchParams(req.query as Record<string, string>);
    const { statusCode, data } = await forwardRequest(
      req,
      `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}/messages?${query.toString()}`,
      token
    );
    return reply.status(statusCode).send(data);
  });

  server.get('/api/v1/messages/:message_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { message_id } = req.params as { message_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/messages/${message_id}`, token);
    return reply.status(statusCode).send(data);
  });

  server.put('/api/v1/messages/:message_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { message_id } = req.params as { message_id: string };
    MessageSendSchema.partial().parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/messages/${message_id}`, token);
    return reply.status(statusCode).send(data);
  });

  server.delete('/api/v1/messages/:message_id', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { message_id } = req.params as { message_id: string };
    const query = new URLSearchParams(req.query as Record<string, string>);
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/messages/${message_id}?${query.toString()}`, token);
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/messages/:message_id/reactions', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    MessageReactionSchema.parse(req.body);
    const { message_id } = req.params as { message_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/messages/${message_id}/reactions`, token);
    return reply.status(statusCode).send(data);
  });

  server.delete('/api/v1/messages/:message_id/reactions/:emoji', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { message_id, emoji } = req.params as { message_id: string; emoji: string };
    const { statusCode, data } = await forwardRequest(
      req,
      `${process.env.MESSAGE_SERVICE_URL}/messages/${message_id}/reactions/${emoji}`,
      token
    );
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/conversations/:conversation_id/messages/search', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const { statusCode, data } = await forwardRequest(
      req,
      `${process.env.MESSAGE_SERVICE_URL}/conversations/${conversation_id}/messages/search`,
      token
    );
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/messages/read', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    MessageReadSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/messages/read`, token);
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/messages', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    MessageSendSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/messages`, token);
    return reply.status(statusCode).send(data);
  });
};
