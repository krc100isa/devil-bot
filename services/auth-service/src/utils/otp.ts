import { nanoid } from 'nanoid';
import type Redis from 'ioredis';

export const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

export const createVerification = async (redis: Redis, phone: string, deviceInfo: Record<string, unknown>) => {
  const verificationId = nanoid();
  const otp = generateOtp();
  const ttl = Number(process.env.OTP_TTL ?? 300);
  await redis.setex(`otp:${verificationId}`, ttl, JSON.stringify({ otp, phone, deviceInfo }));
  return { verificationId, otp };
};

export const verifyOtp = async (redis: Redis, verificationId: string, code: string) => {
  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
  const attemptsKey = `otp_attempts:${verificationId}`;
  const attempts = Number((await redis.get(attemptsKey)) ?? '0');
  if (attempts >= maxAttempts) {
    throw new Error('OTP attempts exceeded');
  }
  const payload = await redis.get(`otp:${verificationId}`);
  if (!payload) {
    throw new Error('OTP expired');
  }
  const data = JSON.parse(payload) as { otp: string; phone: string; deviceInfo: Record<string, unknown> };
  if (data.otp !== code) {
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, Number(process.env.OTP_TTL ?? 300));
    throw new Error('Invalid OTP');
  }
  await redis.del(`otp:${verificationId}`);
  await redis.del(attemptsKey);
  return { phone: data.phone, deviceInfo: data.deviceInfo };
};
