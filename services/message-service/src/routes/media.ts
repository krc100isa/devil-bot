import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../utils/auth.js';
import { nanoid } from 'nanoid';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const registerMediaRoutes = (server: FastifyInstance) => {
  const client = new S3Client({
    region: 'us-east-1',
    endpoint: `http://${process.env.MINIO_ENDPOINT ?? 'localhost'}:${process.env.MINIO_PORT ?? '9000'}`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin'
    }
  });
  const bucket = process.env.MINIO_BUCKET ?? 'securechat';

  server.post('/media/upload-url', async (req, reply) => {
    const { payload } = await requireAuth(req, server.redis);
    const { content_type, size_bytes } = (req.body ?? {}) as { content_type?: string; size_bytes?: number };
    if (!content_type || !size_bytes) {
      return reply.status(400).send({ error: { message: 'content_type and size_bytes required' } });
    }
    const fileId = nanoid();
    const key = `${payload.sub}/${fileId}`;

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: content_type });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

    await server.mongo.db().collection('media_files').insertOne({
      file_id: fileId,
      uploader_id: payload.sub,
      bucket,
      key,
      content_type,
      size_bytes,
      status: 'pending',
      created_at: new Date()
    });

    return reply.send({ file_id: fileId, upload_url: uploadUrl });
  });

  server.post('/media/complete', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { file_id } = (req.body ?? {}) as { file_id?: string };
    if (!file_id) {
      return reply.status(400).send({ error: { message: 'file_id required' } });
    }
    await server.mongo.db().collection('media_files').updateOne({ file_id }, { $set: { status: 'ready' } });
    return reply.send({ status: 'ready' });
  });

  server.get('/media/:file_id/download', async (req, reply) => {
    await requireAuth(req, server.redis);
    const { file_id } = req.params as { file_id: string };
    const file = await server.mongo.db().collection('media_files').findOne({ file_id });
    if (!file) {
      return reply.status(404).send({ error: { message: 'file not found' } });
    }
    const command = new GetObjectCommand({ Bucket: bucket, Key: file.key });
    const downloadUrl = await getSignedUrl(client, command, { expiresIn: 600 });
    return reply.send({ download_url: downloadUrl });
  });
};
