import { request } from 'undici';
import type { FastifyRequest } from 'fastify';

export const forwardRequest = async (req: FastifyRequest, url: string, token?: string) => {
  const headers = {
    'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
  const { statusCode, body } = await request(url, {
    method: req.method,
    headers,
    body: req.body ? JSON.stringify(req.body) : undefined
  });
  const data = await body.json().catch(() => null);
  return { statusCode, data };
};
