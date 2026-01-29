import type { FastifyInstance } from 'fastify';
import { RegisterSchema, VerifyOtpSchema, RefreshSchema, LogoutSchema } from '@securechat/types';
import { createVerification, verifyOtp } from '../utils/otp.js';
import { issueTokens, verifyToken } from '../utils/jwt.js';

export const registerAuthRoutes = (server: FastifyInstance) => {
  server.post('/auth/register', async (req, reply) => {
    const body = RegisterSchema.parse(req.body);
    const { verificationId } = await createVerification(server.redis, `${body.country_code}${body.phone}`, body.device_info);
    return reply.send({ verification_id: verificationId, status: 'sent' });
  });

  server.post('/auth/verify-otp', async (req, reply) => {
    const body = VerifyOtpSchema.parse(req.body);
    const { phone, deviceInfo } = await verifyOtp(server.redis, body.verification_id, body.otp_code);

    const existing = await server.prisma.user.findUnique({ where: { phoneNumber: phone } });
    const user = existing
      ? await server.prisma.user.update({
          where: { id: existing.id },
          data: { publicKey: body.public_key, isVerified: true }
        })
      : await server.prisma.user.create({
          data: {
            phoneNumber: phone,
            displayName: phone,
            publicKey: body.public_key,
            isVerified: true
          }
        });

    const session = await server.prisma.userSession.create({
      data: {
        userId: user.id,
        deviceId: String(deviceInfo.device_id ?? body.public_key.slice(0, 12)),
        deviceName: String(deviceInfo.device_name ?? 'device'),
        deviceType: (deviceInfo.device_type as 'ios' | 'android' | 'web' | 'desktop') ?? 'web',
        pushToken: (deviceInfo.push_token as string) ?? null,
        ipAddress: req.ip,
        location: null,
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + Number(process.env.REFRESH_TOKEN_TTL ?? 2592000) * 1000),
        isActive: true
      }
    });

    const tokens = issueTokens({ sub: user.id, session_id: session.id });
    const refreshPayload = verifyToken(tokens.refreshToken) as { jti?: string };
    if (refreshPayload.jti) {
      await server.redis.setex(`refresh:${refreshPayload.jti}`, Number(process.env.REFRESH_TOKEN_TTL ?? 2592000), session.id);
    }

    return reply.send({ user, access_token: tokens.accessToken, refresh_token: tokens.refreshToken, session_id: session.id });
  });

  server.post('/auth/refresh', async (req, reply) => {
    const body = RefreshSchema.parse(req.body);
    const payload = verifyToken(body.refresh_token) as { sub: string; session_id: string; jti?: string };
    if (payload.jti) {
      const active = await server.redis.get(`refresh:${payload.jti}`);
      if (!active) {
        return reply.status(401).send({ error: { message: 'Refresh token revoked' } });
      }
    }
    const tokens = issueTokens({ sub: payload.sub, session_id: payload.session_id });
    return reply.send({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
  });

  server.post('/auth/logout', async (req, reply) => {
    const body = LogoutSchema.parse(req.body);
    const payload = verifyToken(body.refresh_token) as { jti?: string; session_id: string };
    if (payload.jti) {
      await server.redis.del(`refresh:${payload.jti}`);
    }
    if (body.access_token) {
      const accessPayload = verifyToken(body.access_token) as { jti?: string; exp?: number };
      if (accessPayload.jti) {
        const ttl = accessPayload.exp ? Math.max(accessPayload.exp - Math.floor(Date.now() / 1000), 0) : 3600;
        await server.redis.setex(`jwt:blacklist:${accessPayload.jti}`, ttl, 'revoked');
      }
    }
    await server.prisma.userSession.update({ where: { id: payload.session_id }, data: { isActive: false } });
    return reply.send({ status: 'logged_out' });
  });
};
