import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  USER_REFRESH_TOKEN_COOKIE_NAME,
  verifyUserToken,
  signUserToken,
  setUserAuthCookie,
} from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(USER_REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token not found' }, { status: 401 });
    }

    const payload = verifyUserToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Generate new 2-day access token
    const newAccessToken = signUserToken({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      tier: payload.tier,
      role: payload.role,
    });

    await setUserAuthCookie(newAccessToken);

    return NextResponse.json({
      success: true,
      message: 'Access token refreshed successfully',
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
