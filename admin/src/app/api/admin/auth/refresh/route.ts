import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  verifyAdminToken,
  signAdminToken,
  setAdminAuthCookie,
} from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token not found' }, { status: 401 });
    }

    const payload = verifyAdminToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Generate new access token for 2 days
    const newAccessToken = signAdminToken({
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role,
    });

    await setAdminAuthCookie(newAccessToken);

    return NextResponse.json({
      success: true,
      message: 'Access token refreshed successfully',
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
