import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'gravoz_ecommerce_super_secure_jwt_secret_key_2026_xyz!';
export const USER_TOKEN_COOKIE_NAME = 'gravoz_user_token';

// 2 weeks in seconds (14 days * 24 hours * 60 minutes * 60 seconds)
export const TWO_WEEKS_IN_SECONDS = 14 * 24 * 60 * 60; // 1,209,600s

export interface UserJwtPayload {
  userId: string;
  email: string;
  name: string;
  role?: string;
  tier?: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateReferralCode(name: string): string {
  const cleanName = (name || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'GRV';
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${cleanName}-${randomSuffix}`;
}

export function signUserToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '14d' });
}

export function verifyUserToken(token: string): UserJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserJwtPayload;
  } catch {
    return null;
  }
}

export async function getUserSession(): Promise<UserJwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyUserToken(token);
  } catch {
    return null;
  }
}

export async function setUserAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TWO_WEEKS_IN_SECONDS, // Exactly 2 weeks
  });
}

export async function removeUserAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}
