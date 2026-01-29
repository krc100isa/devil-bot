import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { createLogger } from '@securechat/observability';
import { WsAuthSchema, MessageSendSchema, MessageReadSchema, WsTypingSchema } from '@securechat/types';

config();

const logger = createLogger(process.env.SERVICE_NAME ?? 'websocket-gateway');
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
const issuer = process.env.JWT_ISSUER ?? 'securechat';

io.on('connection', (socket) => {
  let userId: string | null = null;
  let sessionId: string | null = null;

  socket.on('connection:authenticate', async (payload) => {
    try {
      const data = WsAuthSchema.parse(payload);
      if (!publicKey) {
        socket.emit('error', { message: 'missing jwt key' });
        return;
      }
      const decoded = jwt.verify(data.token, publicKey, { algorithms: ['RS256'], issuer }) as {
        sub: string;
        session_id: string;
        jti?: string;
      };
      if (decoded.jti) {
        const revoked = await redis.get(`jwt:blacklist:${decoded.jti}`);
        if (revoked) {
          socket.emit('error', { message: 'token revoked' });
          return;
        }
      }
      userId = decoded.sub;
      sessionId = decoded.session_id;

      socket.join(`user:${userId}`);
      await redis.set(`presence:${userId}`, 'online', 'EX', 60);
      if (sessionId) {
        await redis.sadd(`sessions:${userId}`, sessionId);
        await redis.expire(`sessions:${userId}`, 86400);
      }

      socket.emit('connection:authenticated', {
        user_id: userId,
        session_id: sessionId,
        server_time: Date.now()
      });
    } catch (error) {
      socket.emit('error', { message: 'authentication failed' });
    }
  });

  socket.on('connection:ping', () => {
    socket.emit('connection:pong', { ts: Date.now() });
  });

  socket.on('message:send', async (payload) => {
    if (!userId) return;
    const data = MessageSendSchema.parse(payload);
    await redis.xadd(
      `conversation:${data.conversation_id}`,
      '*',
      'event',
      'message:send',
      'payload',
      JSON.stringify({ ...data, sender_id: userId })
    );
    socket.emit('message:sent', {
      client_message_id: data.client_message_id,
      message_id: data.temp_id ?? data.client_message_id,
      temp_id: data.temp_id,
      status: 'sent',
      timestamp: new Date().toISOString()
    });
  });

  socket.on('message:delivery', async (payload) => {
    if (!userId) return;
    await redis.xadd(
      `conversation:${payload.conversation_id}`,
      '*',
      'event',
      'message:delivery',
      'payload',
      JSON.stringify({ ...payload, user_id: userId })
    );
  });

  socket.on('message:read', async (payload) => {
    if (!userId) return;
    const data = MessageReadSchema.parse(payload);
    await redis.xadd(
      `conversation:${data.conversation_id}`,
      '*',
      'event',
      'message:read',
      'payload',
      JSON.stringify({ ...data, user_id: userId })
    );
  });

  socket.on('message:reaction', async (payload) => {
    if (!userId) return;
    await redis.xadd(
      `conversation:${payload.conversation_id}`,
      '*',
      'event',
      'message:reaction',
      'payload',
      JSON.stringify({ ...payload, user_id: userId })
    );
  });

  socket.on('presence:subscribe', async (payload) => {
    if (!userId) return;
    const { user_ids } = payload as { user_ids: string[] };
    const statuses = await Promise.all(
      user_ids.map(async (id) => ({ user_id: id, status: (await redis.get(`presence:${id}`)) ?? 'offline' }))
    );
    socket.emit('presence:update', statuses);
  });

  socket.on('conversation:join', (payload) => {
    if (!userId) return;
    const { conversation_id } = payload as { conversation_id: string };
    socket.join(`conversation:${conversation_id}`);
  });

  socket.on('typing:start', async (payload) => {
    if (!userId) return;
    const data = WsTypingSchema.parse(payload);
    await redis.set(`typing:${data.conversation_id}:${userId}`, '1', 'EX', 5);
    socket.to(`conversation:${data.conversation_id}`).emit('typing:update', {
      conversation_id: data.conversation_id,
      user_id: userId,
      status: 'start'
    });
  });

  socket.on('typing:stop', async (payload) => {
    if (!userId) return;
    const data = WsTypingSchema.parse(payload);
    await redis.del(`typing:${data.conversation_id}:${userId}`);
    socket.to(`conversation:${data.conversation_id}`).emit('typing:update', {
      conversation_id: data.conversation_id,
      user_id: userId,
      status: 'stop'
    });
  });

  socket.on('call:initiate', async (payload) => {
    if (!userId) return;
    await redis.xadd('calls', '*', 'event', 'call:initiate', 'payload', JSON.stringify({ ...payload, from: userId }));
  });

  socket.on('call:accept', async (payload) => {
    if (!userId) return;
    await redis.xadd('calls', '*', 'event', 'call:accept', 'payload', JSON.stringify({ ...payload, user_id: userId }));
  });

  socket.on('call:reject', async (payload) => {
    if (!userId) return;
    await redis.xadd('calls', '*', 'event', 'call:reject', 'payload', JSON.stringify({ ...payload, user_id: userId }));
  });

  socket.on('call:end', async (payload) => {
    if (!userId) return;
    await redis.xadd('calls', '*', 'event', 'call:end', 'payload', JSON.stringify({ ...payload, user_id: userId }));
  });

  socket.on('call:ice_candidate', async (payload) => {
    if (!userId) return;
    await redis.xadd('calls', '*', 'event', 'call:ice_candidate', 'payload', JSON.stringify({ ...payload, user_id: userId }));
  });

  socket.on('call:sdp_offer', async (payload) => {
    if (!userId) return;
    await redis.xadd('calls', '*', 'event', 'call:sdp_offer', 'payload', JSON.stringify({ ...payload, user_id: userId }));
  });

  socket.on('call:sdp_answer', async (payload) => {
    if (!userId) return;
    await redis.xadd('calls', '*', 'event', 'call:sdp_answer', 'payload', JSON.stringify({ ...payload, user_id: userId }));
  });

  socket.on('disconnect', async () => {
    if (userId) {
      await redis.set(`presence:${userId}`, 'offline', 'EX', 60);
      await redis.set(`last_seen:${userId}`, new Date().toISOString(), 'EX', 86400);
      if (sessionId) {
        await redis.srem(`sessions:${userId}`, sessionId);
      }
    }
  });
});

const stream = 'system:events';
let lastId = '0-0';

const poll = async () => {
  const entries = await redis.xread('BLOCK', 1000, 'STREAMS', stream, lastId);
  if (entries) {
    for (const [, messages] of entries) {
      for (const [id, fields] of messages as [string, string[]][]) {
        lastId = id;
        const payload = JSON.parse(fields[fields.indexOf('payload') + 1]);
        const event = fields[fields.indexOf('event') + 1];
        if (payload?.conversation_id) {
          io.to(`conversation:${payload.conversation_id}`).emit(event, payload);
        }
        if (payload?.recipient_id) {
          io.to(`user:${payload.recipient_id}`).emit(event, payload);
        }
      }
    }
  }
  setImmediate(poll);
};

poll().catch((err) => logger.error(err, 'stream poll error'));

const port = Number(process.env.PORT ?? 5000);
httpServer.listen(port, '0.0.0.0', () => {
  logger.info({ port }, 'websocket-gateway listening');
});
