import type { FastifyRequest } from 'fastify';
import createError from 'http-errors';
import { verifyToken } from './jwt.js';
import type Redis from 'ioredis';

export const requireAuth = async (req: FastifyRequest, redis?: Redis) => {
  const header = req.headers.authorization;
  if (!header) {
    throw createError(401, 'Missing authorization header');
  }
  const token = header.replace('Bearer ', '');
  try {
    const payload = verifyToken(token) as { sub: string; session_id: string; jti?: string };
    if (redis && payload.jti) {
      const revoked = await redis.get(`jwt:blacklist:${payload.jti}`);
      if (revoked) {
        throw createError(401, 'Token revoked');
      }
    }
    return { token, payload };
  } catch (error) {
    throw createError(401, 'Invalid token');
  }
};
