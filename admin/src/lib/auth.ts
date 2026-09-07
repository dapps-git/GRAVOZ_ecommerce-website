import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'gravoz_ecommerce_super_secure_jwt_secret_key_2026_xyz!';
export const TOKEN_COOKIE_NAME = 'gravoz_admin_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'gravoz_admin_refresh_token';

// 2 days in seconds (2 * 24 * 60 * 60)
export const ACCESS_TOKEN_MAX_AGE = 2 * 24 * 60 * 60; // 172,800s
// 24 days in seconds (24 * 24 * 60 * 60)
export const REFRESH_TOKEN_MAX_AGE = 24 * 24 * 60 * 60; // 2,073,600s

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
    return jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminJwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifyAdminToken(token);
      if (payload) return payload;
    }

    // Try refresh token if access token is expired/missing
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
    if (refreshToken) {
      const payload = verifyAdminToken(refreshToken);
      if (payload) {
        // Re-issue a fresh 2-day access token
        const newAccessToken = signAdminToken({
          adminId: payload.adminId,
          email: payload.email,
          role: payload.role,
        });
        cookieStore.set(TOKEN_COOKIE_NAME, newAccessToken, {
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
