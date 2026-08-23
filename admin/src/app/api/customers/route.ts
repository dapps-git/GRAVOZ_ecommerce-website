import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/models/Customer';

export async function GET() {
  try {
    await connectDB();
    const customers = await Customer.find({}).sort({ createdAt: -1 });
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

    const referralCode = `GRAV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const customer = await Customer.create({
      name,
      email,
      phone: phone || '',
      referralCode,
      referredBy: referredBy || '',
      rewardPoints: 100, // Sign up bonus
      activityLogs: [{ action: 'Account Created', details: 'Joined GRAVOZ Platform with 100 Reward Points' }],
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
    const { id, rewardPoints, tier } = body;

    const customer = await Customer.findById(id);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    if (rewardPoints !== undefined) customer.rewardPoints = rewardPoints;
    if (tier !== undefined) customer.tier = tier;
    customer.activityLogs.push({ action: 'Admin Update', details: `Points set to ${customer.rewardPoints}, Tier: ${customer.tier}` });

    await customer.save();
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
