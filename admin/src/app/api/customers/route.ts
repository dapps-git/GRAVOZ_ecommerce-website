import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/models/Customer';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const tier = searchParams.get('tier') || '';

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (tier) filter.tier = tier;

    const customers = await Customer.find(filter)
      .select('-passwordHash -otpCode -resetPasswordToken')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, phone, referredBy } = body;

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await Customer.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const referralCode = `GRAV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const customer = await Customer.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : '',
      referralCode,
      referredBy: referredBy || '',
      rewardPoints: 100,
      isActive: true,
      activityLogs: [{ action: 'Account Created', details: 'Registered by Admin' }],
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, rewardPoints, tier, isActive } = body;

    const customer = await Customer.findById(id);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    if (rewardPoints !== undefined) customer.rewardPoints = Number(rewardPoints);
    if (tier !== undefined) customer.tier = tier;
    if (typeof isActive === 'boolean') customer.isActive = isActive;

    if (!customer.activityLogs) customer.activityLogs = [];
    customer.activityLogs.push({
      action: 'Admin Update',
      details: `Status: ${customer.isActive ? 'Active' : 'Deactivated'}, Points: ${customer.rewardPoints}, Tier: ${customer.tier}`,
      timestamp: new Date(),
    });

    await customer.save();
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });

    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Customer deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
