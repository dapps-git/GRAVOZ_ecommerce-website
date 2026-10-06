import { NextResponse } from 'next/server';
import { removeUserAuthCookie, USER_TOKEN_COOKIE_NAME, USER_REFRESH_TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  await removeUserAuthCookie();
  
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Explicitly invalidate cookies on response headers for Next.js 15
  response.cookies.set(USER_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set(USER_REFRESH_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

