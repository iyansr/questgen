import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'hono/jwt';

const SALT_ROUNDS = 10;
const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 30;

export type JwtPayload = {
  userId: string;
  email: string;
  exp: number;
  iat: number;
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function signToken(
  payload: { userId: string; email: string },
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      ...payload,
      iat: now,
      exp: now + JWT_EXPIRY_SECONDS,
    },
    secret,
  );
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<JwtPayload> {
  return (await verify(token, secret, 'HS256')) as JwtPayload;
}
