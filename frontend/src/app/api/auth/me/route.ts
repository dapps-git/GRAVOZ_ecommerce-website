import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    await connectDB();
    const customer = await Customer.findById(session.userId).select(
      '-passwordHash -resetPasswordToken -resetPasswordExpires'
    );

    if (!customer || !customer.isActive) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatarUrl: customer.avatarUrl,
        addresses: customer.addresses,
        rewardPoints: customer.rewardPoints,
        referralCode: customer.referralCode,
        tier: customer.tier,
        authProvider: customer.authProvider,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        createdAt: customer.createdAt,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Session check error:', err);
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}
