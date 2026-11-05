import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies, headers } from 'next/headers';

const JWT_SECRET: string = process.env.JWT_SECRET || '';

export const USER_TOKEN_COOKIE_NAME = process.env.USER_TOKEN_COOKIE_NAME || 'gravoz_user_token';
export const USER_REFRESH_TOKEN_COOKIE_NAME = process.env.USER_REFRESH_TOKEN_COOKIE_NAME || 'gravoz_user_refresh_token';

// Read token expiry durations from environment variables (defaults: 2 days, 24 days)
export const ACCESS_TOKEN_MAX_AGE = Number(process.env.ACCESS_TOKEN_MAX_AGE) || 2 * 24 * 60 * 60;
export const REFRESH_TOKEN_MAX_AGE = Number(process.env.REFRESH_TOKEN_MAX_AGE) || 24 * 24 * 60 * 60;

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
  const cleanName = (name || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'GRVZ';
  const prefix = cleanName.padEnd(4, 'X');
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}${num}`;
}

export function signUserToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2d' });
}

export function signUserRefreshToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24d' });
}

export function verifyUserToken(token: string): UserJwtPayload | null {
  try {
    if (!token || !JWT_SECRET) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded) return null;
    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) return null;
    return {
      userId: String(userId),
      email: decoded.email ? String(decoded.email).toLowerCase().trim() : '',
      name: decoded.name || '',
      role: decoded.role,
      tier: decoded.tier,
    };
  } catch {
    return null;
  }
}

export async function getUserSession(): Promise<UserJwtPayload | null> {
  try {
    // 1. Check Authorization Bearer header or custom header
    try {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization') || headerStore.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.slice(7).trim();
        const payload = verifyUserToken(bearerToken);
        if (payload) return payload;
      }
      const xAuth = headerStore.get('x-access-token') || headerStore.get('x-auth-token');
      if (xAuth) {
        const payload = verifyUserToken(xAuth.trim());
        if (payload) return payload;
      }
      // Check middleware-forwarded verified user header
      const forwardedUserId = headerStore.get('x-user-id');
      if (forwardedUserId) {
        return {
          userId: forwardedUserId,
          email: headerStore.get('x-user-email') || '',
          name: headerStore.get('x-user-name') || '',
          role: headerStore.get('x-user-role') || 'customer',
        };
      }
    } catch {
      // Header inspection ignored if context does not support headers
    }

    // 2. Check cookies
    const cookieStore = await cookies();
    const token =
      cookieStore.get(USER_TOKEN_COOKIE_NAME)?.value ||
      cookieStore.get('gravoz_user_token')?.value ||
      cookieStore.get('token')?.value;

    if (token) {
      const payload = verifyUserToken(token);
      if (payload) return payload;
    }

    // 3. Try refresh token if access token is expired or missing
    const refreshToken =
      cookieStore.get(USER_REFRESH_TOKEN_COOKIE_NAME)?.value ||
      cookieStore.get('gravoz_user_refresh_token')?.value;

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
        try {
          cookieStore.set(USER_TOKEN_COOKIE_NAME, newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: ACCESS_TOKEN_MAX_AGE,
          });
        } catch {
          // Read-only server component render context; still return valid payload
        }
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
