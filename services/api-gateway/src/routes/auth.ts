import type { FastifyInstance } from 'fastify';
import { RegisterSchema, VerifyOtpSchema, RefreshSchema, LogoutSchema } from '@securechat/types';
import { forwardRequest } from '../utils/proxy.js';

export const registerAuthRoutes = (server: FastifyInstance) => {
  server.post('/api/v1/auth/register', async (req, reply) => {
    RegisterSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/auth/register`);
    return reply.status(statusCode).send(data ?? { error: { message: 'upstream error' } });
  });

  server.post('/api/v1/auth/verify-otp', async (req, reply) => {
    VerifyOtpSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/auth/verify-otp`);
    return reply.status(statusCode).send(data ?? { error: { message: 'upstream error' } });
  });

  server.post('/api/v1/auth/refresh', async (req, reply) => {
    RefreshSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/auth/refresh`);
    return reply.status(statusCode).send(data ?? { error: { message: 'upstream error' } });
  });

  server.post('/api/v1/auth/logout', async (req, reply) => {
    LogoutSchema.parse(req.body);
    const { statusCode, data } = await forwardRequest(req, `${process.env.AUTH_SERVICE_URL}/auth/logout`);
    return reply.status(statusCode).send(data ?? { error: { message: 'upstream error' } });
  });
};
