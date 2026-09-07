import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'gravoz_ecommerce_super_secure_jwt_secret_key_2026_xyz!';
export const USER_TOKEN_COOKIE_NAME = 'gravoz_user_token';
export const USER_REFRESH_TOKEN_COOKIE_NAME = 'gravoz_user_refresh_token';

// 2 days in seconds (2 * 24 * 60 * 60)
export const ACCESS_TOKEN_MAX_AGE = 2 * 24 * 60 * 60; // 172,800s
// 24 days in seconds (24 * 24 * 60 * 60)
export const REFRESH_TOKEN_MAX_AGE = 24 * 24 * 60 * 60; // 2,073,600s

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2d' });
}

export function signUserRefreshToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24d' });
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
    if (token) {
      const payload = verifyUserToken(token);
      if (payload) return payload;
    }

    // Try refresh token if access token is expired or missing
    const refreshToken = cookieStore.get(USER_REFRESH_TOKEN_COOKIE_NAME)?.value;
    if (refreshToken) {
      const payload = verifyUserToken(refreshToken);
      if (payload) {
        // Re-issue a fresh 2-day access token
        const newAccessToken = signUserToken({
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          tier: payload.tier,
        });
        cookieStore.set(USER_TOKEN_COOKIE_NAME, newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: ACCESS_TOKEN_MAX_AGE,
        });
        return payload;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function setUserAuthCookie(token: string, refreshToken?: string): Promise<void> {
  const cookieStore = await cookies();
  
  // Access Token: 2 Days
  cookieStore.set(USER_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE, // 2 days
  });

  // Refresh Token: 24 Days
  if (refreshToken) {
    cookieStore.set(USER_REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE, // 24 days
    });
  }
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

  cookieStore.set(USER_REFRESH_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}
