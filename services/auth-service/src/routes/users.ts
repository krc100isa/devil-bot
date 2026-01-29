import type { FastifyInstance } from 'fastify';
import { UpdateUserSchema, PrivacySchema } from '@securechat/types';
import { requireAuth } from '../utils/auth.js';

export const registerUserRoutes = (server: FastifyInstance) => {
  server.get('/users/me', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const user = await server.prisma.user.findUnique({ where: { id: payload.sub } });
    return reply.send({ user });
  });

  server.put('/users/me', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const body = UpdateUserSchema.parse(req.body);
    const user = await server.prisma.user.update({ where: { id: payload.sub }, data: body });
    return reply.send({ user });
  });

  server.get('/users/:user_id', async (req, reply) => {
    const { user_id } = req.params as { user_id: string };
    const user = await server.prisma.user.findUnique({ where: { id: user_id } });
    return reply.send({ user });
  });

  server.get('/users/search', async (req, reply) => {
    const { q } = req.query as { q?: string };
    const users = await server.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { displayName: { contains: q, mode: 'insensitive' } },
              { username: { contains: q, mode: 'insensitive' } },
              { phoneNumber: { contains: q } }
            ]
          }
        : undefined,
      take: 20
    });
    return reply.send({ users });
  });

  server.put('/users/me/privacy', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const body = PrivacySchema.parse(req.body);
    const user = await server.prisma.user.update({
      where: { id: payload.sub },
      data: { privacy: body.privacy, readReceipts: body.read_receipts }
    });
    return reply.send({ user });
  });
};
