import type { FastifyInstance } from 'fastify';
import { PreKeyBundleSchema } from '@securechat/types';
import { requireAuth } from '../utils/auth.js';

export const registerKeyRoutes = (server: FastifyInstance) => {
  server.post('/keys/bundle', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const body = PreKeyBundleSchema.parse(req.body);

    await server.prisma.preKeyBundle.upsert({
      where: { userId: payload.sub },
      update: {
        identityKey: body.identity_key,
        signedPreKeyId: body.signed_prekey.key_id,
        signedPreKey: body.signed_prekey.public_key,
        signedPreKeySig: body.signed_prekey.signature
      },
      create: {
        userId: payload.sub,
        identityKey: body.identity_key,
        signedPreKeyId: body.signed_prekey.key_id,
        signedPreKey: body.signed_prekey.public_key,
        signedPreKeySig: body.signed_prekey.signature
      }
    });

    await server.prisma.oneTimePreKey.createMany({
      data: body.one_time_prekeys.map((key) => ({
        userId: payload.sub,
        keyId: key.key_id,
        publicKey: key.public_key
      })),
      skipDuplicates: true
    });

    return reply.send({ status: 'stored' });
  });

  server.get('/keys/bundle/:user_id', async (req, reply) => {
    const { user_id } = req.params as { user_id: string };
    const bundle = await server.prisma.preKeyBundle.findUnique({ where: { userId: user_id } });
    if (!bundle) {
      return reply.status(404).send({ error: { message: 'bundle not found' } });
    }
    const oneTime = await server.prisma.oneTimePreKey.findFirst({ where: { userId: user_id } });
    if (oneTime) {
      await server.prisma.oneTimePreKey.delete({ where: { id: oneTime.id } });
    }
    return reply.send({
      identity_key: bundle.identityKey,
      signed_prekey: {
        key_id: bundle.signedPreKeyId,
        public_key: bundle.signedPreKey,
        signature: bundle.signedPreKeySig
      },
      one_time_prekey: oneTime
        ? {
            key_id: oneTime.keyId,
            public_key: oneTime.publicKey
          }
        : null
    });
  });
};
