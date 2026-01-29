import type { FastifyInstance } from 'fastify';
import { MessageSendSchema, MessageReadSchema } from '@securechat/types';
import { requireAuth } from '../utils/auth.js';
import { nanoid } from 'nanoid';

export const registerMessageRoutes = (server: FastifyInstance) => {
  const messages = server.mongo.db().collection('messages');

  server.post('/messages', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const body = MessageSendSchema.parse(req.body);

    const existing = await messages.findOne({ client_message_id: body.client_message_id });
    if (existing) {
      return reply.send({ message: existing, status: 'duplicate' });
    }

    const now = new Date();
    const message = {
      message_id: nanoid(),
      client_message_id: body.client_message_id,
      conversation_id: body.conversation_id,
      sender_id: payload.sub,
      content: body.content,
      type: body.type,
      reply_to: body.reply_to ?? null,
      forwarded_from: null,
      delivery_status: 'sent',
      is_edited: false,
      edited_at: null,
      original_content: null,
      reactions: [],
      created_at: now
    };

    await messages.insertOne(message);

    await server.redis.xadd(
      `conversation:${body.conversation_id}`,
      '*',
      'event',
      'message:received',
      'payload',
      JSON.stringify(message)
    );
    await server.redis.xadd(
      'system:events',
      '*',
      'event',
      'message:received',
      'payload',
      JSON.stringify(message)
    );
    await server.redis.xadd(
      'notifications',
      '*',
      'event',
      'message:new',
      'payload',
      JSON.stringify({ conversation_id: body.conversation_id, message_id: message.message_id })
    );

    return reply.send({ message_id: message.message_id, status: 'sent', timestamp: now.toISOString() });
  });

  server.get('/conversations/:conversation_id/messages', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const { before_id, after_id, limit = '50' } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { conversation_id };
    if (before_id) {
      query.message_id = { $lt: before_id };
    }
    if (after_id) {
      query.message_id = { $gt: after_id };
    }
    const items = await messages.find(query).sort({ created_at: -1 }).limit(Number(limit)).toArray();
    return reply.send({ messages: items });
  });

  server.get('/messages/:message_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { message_id } = req.params as { message_id: string };
    const message = await messages.findOne({ message_id });
    return reply.send({ message });
  });

  server.put('/messages/:message_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { message_id } = req.params as { message_id: string };
    const updates = (req.body ?? {}) as Record<string, unknown>;
    const message = await messages.findOneAndUpdate(
      { message_id },
      {
        $set: {
          content: updates.content,
          is_edited: true,
          edited_at: new Date(),
          original_content: updates.original_content ?? null
        }
      },
      { returnDocument: 'after' }
    );
    return reply.send({ message: message.value });
  });

  server.delete('/messages/:message_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { message_id } = req.params as { message_id: string };
    const { mode } = req.query as { mode?: string };
    if (mode === 'everyone') {
      await messages.updateOne({ message_id }, { $set: { deleted_for_everyone: true } });
    } else {
      await messages.updateOne({ message_id }, { $addToSet: { deleted_for: 'self' } });
    }
    return reply.send({ status: 'deleted' });
  });

  server.post('/messages/:message_id/reactions', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const { message_id } = req.params as { message_id: string };
    const { emoji } = (req.body ?? {}) as { emoji?: string };
    if (!emoji) {
      return reply.status(400).send({ error: { message: 'emoji required' } });
    }
    await messages.updateOne({ message_id }, { $addToSet: { reactions: { user_id: payload.sub, emoji } } });
    return reply.send({ status: 'reacted' });
  });

  server.delete('/messages/:message_id/reactions/:emoji', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const { message_id, emoji } = req.params as { message_id: string; emoji: string };
    await messages.updateOne({ message_id }, { $pull: { reactions: { user_id: payload.sub, emoji } } });
    return reply.send({ status: 'removed' });
  });

  server.post('/conversations/:conversation_id/messages/search', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { conversation_id } = req.params as { conversation_id: string };
    const { search } = (req.body ?? {}) as { search?: string };
    const query: Record<string, unknown> = { conversation_id };
    if (search) {
      query['metadata.search_tokens'] = { $regex: search, $options: 'i' };
    }
    const results = await messages.find(query).limit(50).toArray();
    return reply.send({ messages: results });
  });

  server.post('/messages/read', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const body = MessageReadSchema.parse(req.body);
    await server.prisma.conversationParticipant.updateMany({
      where: { conversationId: body.conversation_id, userId: payload.sub },
      data: { lastReadMessageId: body.message_ids.at(-1) }
    });
    await server.redis.xadd(
      `conversation:${body.conversation_id}`,
      '*',
      'event',
      'message:read_receipt',
      'payload',
      JSON.stringify({
        conversation_id: body.conversation_id,
        message_ids: body.message_ids,
        read_by: payload.sub,
        read_at: body.read_at
      })
    );
    await server.redis.xadd(
      'system:events',
      '*',
      'event',
      'message:read_receipt',
      'payload',
      JSON.stringify({
        conversation_id: body.conversation_id,
        message_ids: body.message_ids,
        read_by: payload.sub,
        read_at: body.read_at
      })
    );
    return reply.send({ status: 'read' });
  });
};
