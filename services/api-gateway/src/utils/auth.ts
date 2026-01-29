import type { FastifyRequest } from 'fastify';
import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import type Redis from 'ioredis';

export const requireAuth = async (req: FastifyRequest, redis?: Redis) => {
  const header = req.headers.authorization;
  if (!header) {
    throw createError(401, 'Missing authorization header');
  }
  const token = header.replace('Bearer ', '');
  const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
  if (!publicKey) {
    throw createError(500, 'JWT public key missing');
  }
  const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer: process.env.JWT_ISSUER }) as {
    sub: string;
    session_id: string;
    jti?: string;
  };
  if (redis && payload.jti) {
    const revoked = await redis.get(`jwt:blacklist:${payload.jti}`);
    if (revoked) {
      throw createError(401, 'Token revoked');
    }
  }
  return { token, payload };
};
