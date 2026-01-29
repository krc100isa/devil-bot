import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

export const issueTokens = (payload: { sub: string; session_id: string }) => {
  const privateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!privateKey) {
    throw new Error('JWT private key missing');
  }
  const issuer = process.env.JWT_ISSUER ?? 'securechat';
  const accessTtl = Number(process.env.ACCESS_TOKEN_TTL ?? 900);
  const refreshTtl = Number(process.env.REFRESH_TOKEN_TTL ?? 2592000);
  const kid = process.env.JWT_KID ?? 'securechat-key-1';

  const accessToken = jwt.sign({ ...payload, jti: nanoid() }, privateKey, {
    algorithm: 'RS256',
    expiresIn: accessTtl,
    issuer,
    header: { kid }
  });

  const refreshToken = jwt.sign({ ...payload, jti: nanoid() }, privateKey, {
    algorithm: 'RS256',
    expiresIn: refreshTtl,
    issuer,
    header: { kid }
  });

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string) => {
  const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
  if (!publicKey) {
    throw new Error('JWT public key missing');
  }
  return jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer: process.env.JWT_ISSUER ?? 'securechat' });
};
