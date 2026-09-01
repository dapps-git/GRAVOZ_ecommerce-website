import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';
import { hashPassword, signUserToken, setUserAuthCookie, generateReferralCode } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, phone, referredBy } = body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const formattedPhone = phone ? String(phone).trim().replace(/[^\d+]/g, '') : '';

    // Check if email already exists
    const existingEmailCustomer = await Customer.findOne({ email: normalizedEmail });
    if (existingEmailCustomer) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Check if phone number already exists (if phone provided)
    if (formattedPhone && formattedPhone.length >= 7) {
      const existingPhoneCustomer = await Customer.findOne({ phone: formattedPhone });
      if (existingPhoneCustomer) {
        return NextResponse.json({ error: 'An account with this phone number already exists' }, { status: 409 });
      }
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Generate unique referral code
    let referralCode = generateReferralCode(name);
    let attempts = 0;
    while (await Customer.findOne({ referralCode }) && attempts < 5) {
      referralCode = generateReferralCode(name);
      attempts++;
    }

    // Create customer with welcome bonus reward points
    const customer = await Customer.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      authProvider: 'local',
      isEmailVerified: false,
      phone: phone ? String(phone).trim() : '',
      referralCode,
      referredBy: referredBy ? String(referredBy).trim() : '',
      rewardPoints: 50, // Welcome points
      tier: 'Silver',
      activityLogs: [
        {
          action: 'Account Created',
          details: 'User registered via email and password',
          timestamp: new Date(),
        },
      ],
      lastLogin: new Date(),
    });

    // Sign 2-week JWT token
    const token = signUserToken({
      userId: customer._id.toString(),
      email: customer.email,
      name: customer.name,
      tier: customer.tier,
    });

    // Set 2-week httpOnly cookie
    await setUserAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully',
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
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
