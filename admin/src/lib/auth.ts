import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';

const JWT_SECRET: string = process.env.JWT_SECRET || '';

export const TOKEN_COOKIE_NAME = process.env.ADMIN_TOKEN_COOKIE_NAME || 'gravoz_admin_token';
export const REFRESH_TOKEN_COOKIE_NAME = process.env.ADMIN_REFRESH_TOKEN_COOKIE_NAME || 'gravoz_admin_refresh_token';

// Read token expiry durations from environment variables (defaults: 2 days, 24 days)
export const ACCESS_TOKEN_MAX_AGE = Number(process.env.ACCESS_TOKEN_MAX_AGE) || 2 * 24 * 60 * 60;
export const REFRESH_TOKEN_MAX_AGE = Number(process.env.REFRESH_TOKEN_MAX_AGE) || 24 * 24 * 60 * 60;

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2d' });
}

export function signAdminRefreshToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24d' });
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    if (!token || !JWT_SECRET) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const isAdmin = Boolean(
      decoded && (decoded.adminId || decoded.role === 'admin' || decoded.role === 'superadmin')
    );
    if (!isAdmin) return null;
    return {
      adminId: String(decoded.adminId || decoded.id || decoded._id || 'admin'),
      email: decoded.email ? String(decoded.email).toLowerCase().trim() : '',
      role: decoded.role || 'admin',
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminJwtPayload | null> {
  try {
    // 1. Check Authorization header or middleware-forwarded admin headers
    try {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization') || headerStore.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.slice(7).trim();
        const payload = verifyAdminToken(bearerToken);
        if (payload) return payload;
      }
      const forwardedAdminId = headerStore.get('x-admin-id');
      if (forwardedAdminId) {
        return {
          adminId: forwardedAdminId,
          email: headerStore.get('x-admin-email') || '',
          role: headerStore.get('x-admin-role') || 'admin',
        };
      }
    } catch {
      // Header check ignored if outside request context
    }

    // 2. Check cookies
    const cookieStore = await cookies();
    const token =
      cookieStore.get(TOKEN_COOKIE_NAME)?.value ||
      cookieStore.get('gravoz_admin_token')?.value ||
      cookieStore.get('admin_token')?.value;

    if (token) {
      const payload = verifyAdminToken(token);
      if (payload) return payload;
    }

    // 3. Try refresh token if access token is expired/missing
    const refreshToken =
      cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value ||
      cookieStore.get('gravoz_admin_refresh_token')?.value;

    if (refreshToken) {
      const payload = verifyAdminToken(refreshToken);
      if (payload) {
        // Re-issue a fresh 2-day access token
        const newAccessToken = signAdminToken({
          adminId: payload.adminId,
          email: payload.email,
          role: payload.role,
        });
        try {
          cookieStore.set(TOKEN_COOKIE_NAME, newAccessToken, {
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

export async function setAdminAuthCookie(token: string, refreshToken?: string): Promise<void> {
  const cookieStore = await cookies();
  
  // Access Token: 2 Days
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE, // 2 days
  });

  // Refresh Token: 24 Days
  if (refreshToken) {
    cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE, // 24 days
    });
  }
}

export async function removeAdminAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}
