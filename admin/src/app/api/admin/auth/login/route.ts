import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Admin } from '@/models/Admin';
import { comparePassword, signAdminToken, setAdminAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // 1. Parse body
  let email: string, password: string;
  try {
    const body = await req.json();
    email = body.email?.trim().toLowerCase();
    password = body.password;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // 2. Connect to DB
  try {
    await connectDB();
  } catch (dbErr: unknown) {
    const err = dbErr as Error;
    console.error('[Admin Login] DB connection failed:', err.message);
    return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 });
  }

  // 3. Authenticate
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signAdminToken({
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    await setAdminAuthCookie(token);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Admin Login] Auth error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
