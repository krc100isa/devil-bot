import type { FastifyInstance } from 'fastify';

const stateTransitions: Record<string, string[]> = {
  IDLE: ['DIALING'],
  DIALING: ['CONNECTING', 'REJECTED'],
  CONNECTING: ['ACTIVE', 'REJECTED'],
  ACTIVE: ['ENDED'],
  REJECTED: [],
  ENDED: []
};

export const startCallWorker = (server: FastifyInstance) => {
  const calls = server.mongo.db().collection('calls');
  const stream = 'calls';
  let lastId = '0-0';

  const poll = async () => {
    const entries = await server.redis.xread('BLOCK', 1000, 'STREAMS', stream, lastId);
    if (entries) {
      for (const [, messages] of entries) {
        for (const [id, fields] of messages as [string, string[]][]) {
          lastId = id;
          const payload = JSON.parse(fields[fields.indexOf('payload') + 1]);
          const event = fields[fields.indexOf('event') + 1];

          if (event === 'call:initiate') {
            await calls.insertOne({
              call_id: payload.call_id,
              state: 'DIALING',
              participants: [payload.from, payload.recipient_id],
              type: payload.type,
              created_at: new Date(),
              ice_servers: payload.ice_servers ?? {
                stun: process.env.STUN_URL,
                turn: process.env.TURN_URL
              }
            });
          }

          if (event === 'call:accept') {
            await updateCallState(calls, payload.call_id, 'ACTIVE');
          }

          if (event === 'call:reject') {
            await updateCallState(calls, payload.call_id, 'REJECTED');
          }

          if (event === 'call:end') {
            await updateCallState(calls, payload.call_id, 'ENDED');
          }
        }
      }
    }
    setImmediate(poll);
  };

  poll().catch((err) => server.log.error(err, 'call worker failed'));
};

const updateCallState = async (collection: any, callId: string, nextState: string) => {
  const call = await collection.findOne({ call_id: callId });
  if (!call) return;
  const allowed = stateTransitions[call.state] ?? [];
  if (!allowed.includes(nextState)) return;
  await collection.updateOne({ call_id: callId }, { $set: { state: nextState, updated_at: new Date() } });
};
