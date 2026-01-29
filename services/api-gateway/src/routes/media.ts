import type { FastifyInstance } from 'fastify';
import { UploadUrlSchema } from '@securechat/types';
import { forwardRequest } from '../utils/proxy.js';
import { requireAuth } from '../utils/auth.js';

export const registerMediaRoutes = (server: FastifyInstance) => {
  server.post('/api/v1/media/upload-url', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    UploadUrlSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/media/upload-url`, token);
    return reply.status(statusCode).send(data);
  });

  server.post('/api/v1/media/complete', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/media/complete`, token);
    return reply.status(statusCode).send(data);
  });

  server.get('/api/v1/media/:file_id/download', async (req, reply) => {
    const { token } = await requireAuth(req, server.redis);
    const { file_id } = req.params as { file_id: string };
    const { statusCode, data } = await forwardRequest(req, `${process.env.MESSAGE_SERVICE_URL}/media/${file_id}/download`, token);
    return reply.status(statusCode).send(data);
  });
};
