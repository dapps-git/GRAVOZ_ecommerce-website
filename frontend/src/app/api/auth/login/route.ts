import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';
import { comparePassword, signUserToken, setUserAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const customer = await Customer.findOne({ email: normalizedEmail });

    if (!customer) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!customer.isActive) {
      return NextResponse.json({ error: 'Your account has been deactivated. Please contact support.' }, { status: 403 });
    }

    if (!customer.passwordHash) {
      if (customer.authProvider === 'google') {
        return NextResponse.json(
          { error: 'This account was registered with Google. Please log in using Google.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, customer.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Update last login
    customer.lastLogin = new Date();
    if (!customer.activityLogs) customer.activityLogs = [];
    customer.activityLogs.push({
      action: 'Login',
      details: 'User logged in with email/password',
      timestamp: new Date(),
    });
    await customer.save();

    // Sign 2-week JWT token
    const token = signUserToken({
      userId: customer._id.toString(),
      email: customer.email,
      name: customer.name,
      tier: customer.tier,
    });

    // Set 2-week httpOnly cookie
    await setUserAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatarUrl: customer.avatarUrl,
        rewardPoints: customer.rewardPoints,
        referralCode: customer.referralCode,
        tier: customer.tier,
        authProvider: customer.authProvider,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
