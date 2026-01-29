import type { FastifyInstance } from 'fastify';
import { ContactSchema, ContactUpdateSchema } from '@securechat/types';
import { requireAuth } from '../utils/auth.js';

export const registerContactRoutes = (server: FastifyInstance) => {
  server.get('/contacts', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const contacts = await server.prisma.contact.findMany({
      where: { userId: payload.sub },
      include: { contact: true }
    });
    return reply.send({ contacts });
  });

  server.post('/contacts', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const body = ContactSchema.parse(req.body);
    const contact = await server.prisma.contact.create({
      data: {
        userId: payload.sub,
        contactId: body.contact_id,
        name: body.name,
        status: 'pending'
      }
    });
    return reply.send({ contact });
  });

  server.put('/contacts/:contact_id', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const { contact_id } = req.params as { contact_id: string };
    const body = ContactUpdateSchema.parse(req.body);
    const contact = await server.prisma.contact.update({
      where: { id: contact_id },
      data: { name: body.name, status: body.status as any }
    });
    return reply.send({ contact });
  });

  server.delete('/contacts/:contact_id', async (req, reply) => {
    const { contact_id } = req.params as { contact_id: string };
    const { action } = req.query as { action?: string };
    if (action === 'block') {
      const contact = await server.prisma.contact.update({ where: { id: contact_id }, data: { status: 'blocked' } });
      return reply.send({ contact });
    }
    await server.prisma.contact.delete({ where: { id: contact_id } });
    return reply.send({ status: 'deleted' });
  });

  server.post('/contacts/sync', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const { contacts } = (req.body ?? {}) as { contacts?: string[] };
    if (!contacts) {
      return reply.status(400).send({ error: { message: 'contacts required' } });
    }
    const matches = await server.prisma.user.findMany({ where: { phoneNumber: { in: contacts } } });
    return reply.send({ matches });
  });
};
