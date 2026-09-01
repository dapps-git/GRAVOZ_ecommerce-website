import { NextResponse } from 'next/server';
import { removeUserAuthCookie } from '@/lib/auth';

export async function POST() {
  await removeUserAuthCookie();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
