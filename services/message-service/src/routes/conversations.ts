import type { FastifyInstance } from 'fastify';
import { ConversationSchema } from '@securechat/types';
import { requireAuth } from '../utils/auth.js';

export const registerConversationRoutes = (server: FastifyInstance) => {
  server.get('/conversations', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const { limit = '50', offset = '0', archived, search } = req.query as Record<string, string>;
    const conversations = await server.prisma.conversation.findMany({
      where: {
        isArchived: archived ? archived === 'true' : undefined,
        OR: search
          ? [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }]
          : undefined,
        participants: { some: { userId: payload.sub } }
      },
      take: Number(limit),
      skip: Number(offset)
    });
    return reply.send({ conversations });
  });

  server.post('/conversations', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const body = ConversationSchema.parse(req.body);
    const conversation = await server.prisma.conversation.create({
      data: {
        type: body.type,
        name: body.name,
        description: body.description,
        avatarUrl: body.avatar_url,
        creatorId: payload.sub,
        admins: [payload.sub],
        participants: {
          create: [
            { userId: payload.sub, role: 'owner' },
            ...body.participant_ids.map((id) => ({ userId: id, role: 'member' }))
          ]
        }
      },
      include: { participants: true }
    });
    return reply.send({ conversation });
  });

  server.get('/conversations/:conversation_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const conversation = await server.prisma.conversation.findUnique({
      where: { id: conversation_id },
      include: { participants: true }
    });
    return reply.send({ conversation });
  });

  server.put('/conversations/:conversation_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const body = ConversationSchema.partial().parse(req.body);
    const conversation = await server.prisma.conversation.update({
      where: { id: conversation_id },
      data: {
        name: body.name,
        description: body.description,
        avatarUrl: body.avatar_url,
        isArchived: (body as { is_archived?: boolean }).is_archived
      }
    });
    return reply.send({ conversation });
  });

  server.delete('/conversations/:conversation_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    await server.prisma.conversation.update({ where: { id: conversation_id }, data: { isArchived: true } });
    return reply.send({ status: 'archived' });
  });

  server.post('/conversations/:conversation_id/participants', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const { participant_ids } = (req.body ?? {}) as { participant_ids?: string[] };
    if (!participant_ids) {
      return reply.status(400).send({ error: { message: 'participant_ids required' } });
    }
    await server.prisma.conversationParticipant.createMany({
      data: participant_ids.map((userId) => ({
        conversationId: conversation_id,
        userId,
        role: 'member'
      })),
      skipDuplicates: true
    });
    return reply.send({ status: 'added' });
  });

  server.delete('/conversations/:conversation_id/participants/:user_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { conversation_id, user_id } = req.params as { conversation_id: string; user_id: string };
    await server.prisma.conversationParticipant.updateMany({
      where: { conversationId: conversation_id, userId: user_id },
      data: { leftAt: new Date() }
    });
    return reply.send({ status: 'removed' });
  });

  server.put('/conversations/:conversation_id/participants/:user_id/role', async (req, reply) => {
    requireAuth(req);
    const { conversation_id, user_id } = req.params as { conversation_id: string; user_id: string };
    const { role } = (req.body ?? {}) as { role?: string };
    if (!role) {
      return reply.status(400).send({ error: { message: 'role required' } });
    }
    await server.prisma.conversationParticipant.updateMany({
      where: { conversationId: conversation_id, userId: user_id },
      data: { role: role as any }
    });
    return reply.send({ status: 'updated' });
  });

  server.post('/conversations/:conversation_id/leave', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    await server.prisma.conversationParticipant.updateMany({
      where: { conversationId: conversation_id, userId: payload.sub },
      data: { leftAt: new Date() }
    });
    return reply.send({ status: 'left' });
  });
};
