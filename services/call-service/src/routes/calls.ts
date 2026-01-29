import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../utils/auth.js';

export const registerCallRoutes = (server: FastifyInstance) => {
  const calls = server.mongo.db().collection('calls');

  server.get('/calls', async (req, reply) => {
    const payload = await requireAuth(req, server.redis);
    const items = await calls.find({ participants: payload.sub }).sort({ created_at: -1 }).limit(50).toArray();
    return reply.send({ calls: items });
  });

  server.get('/calls/:call_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { call_id } = req.params as { call_id: string };
    const call = await calls.findOne({ call_id });
    return reply.send({ call });
  });

  server.delete('/calls/:call_id', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { call_id } = req.params as { call_id: string };
    await calls.updateOne({ call_id }, { $set: { state: 'ENDED', ended_at: new Date() } });
    return reply.send({ status: 'ended' });
  });
};
