import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const tier = searchParams.get('tier') || '';

    const filter: any = {};

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ];
    }

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (tier) filter.tier = tier;

    const customers = await Customer.find(filter)
      .select('-passwordHash -otpCode -resetPasswordToken')
      .sort({ createdAt: -1 })
      .lean();

    const totalUsers = await Customer.countDocuments();
    const activeUsers = await Customer.countDocuments({ isActive: true });
    const googleUsers = await Customer.countDocuments({ authProvider: 'google' });

    return NextResponse.json({
      success: true,
      customers,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        googleAuth: googleUsers,
      },
    });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 });
  }
}
