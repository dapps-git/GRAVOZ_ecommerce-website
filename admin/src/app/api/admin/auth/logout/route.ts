import { NextResponse } from 'next/server';
import { removeAdminAuthCookie } from '@/lib/auth';

export async function POST() {
  await removeAdminAuthCookie();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
