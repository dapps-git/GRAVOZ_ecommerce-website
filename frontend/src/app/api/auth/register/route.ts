import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';
import { Referral } from '@/models/Referral';
import { hashPassword, signUserToken, signUserRefreshToken, setUserAuthCookie, generateReferralCode } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, phone, referredBy, referralCode: inputCode } = body;

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
      return NextResponse.json({ error: 'This email address is already registered.' }, { status: 409 });
    }

    // Check if mobile number already exists (if phone provided)
    if (formattedPhone && formattedPhone.length >= 7) {
      const digits10 = formattedPhone.replace(/\D/g, '').slice(-10);
      const existingPhoneCustomer = await Customer.findOne({
        $or: [
          { phone: formattedPhone },
          { phone: { $regex: digits10 + '$' } },
        ],
      });
      if (existingPhoneCustomer) {
        return NextResponse.json({ error: 'This mobile number is already registered.' }, { status: 409 });
      }
    }

    // ── Referral Code Validation ──
    const targetReferralCode = (inputCode || referredBy || '').toString().trim().toUpperCase();
    let referrerCustomer: any = null;

    if (targetReferralCode) {
      referrerCustomer = await Customer.findOne({
        referralCode: targetReferralCode,
        isActive: true,
      });

      if (!referrerCustomer) {
        return NextResponse.json(
          { error: `Referral code "${targetReferralCode}" is invalid. Please check the code or leave it blank.` },
          { status: 400 }
        );
      }

      // Self-referral prevention (Email & Mobile)
      const referrerPhoneClean = referrerCustomer.phone ? referrerCustomer.phone.replace(/\D/g, '').slice(-10) : '';
      const inputPhoneClean = formattedPhone ? formattedPhone.replace(/\D/g, '').slice(-10) : '';
      if (
        referrerCustomer.email.toLowerCase().trim() === normalizedEmail ||
        (referrerPhoneClean && inputPhoneClean && referrerPhoneClean === inputPhoneClean)
      ) {
        return NextResponse.json(
          { error: 'You cannot use your own referral code.' },
          { status: 400 }
        );
      }
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Create customer: Referral link will ONLY be generated after their FIRST qualifying purchase of ₹999+
    const customer = await Customer.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      authProvider: 'local',
      isEmailVerified: false,
      phone: formattedPhone,
      referralEligible: false,
      firstPurchaseCompleted: false,
      referralEligibleOrderId: null,
      referredBy: referrerCustomer ? referrerCustomer._id.toString() : '',
      referralCodeUsed: referrerCustomer ? referrerCustomer.referralCode : '',
      referralDiscountBalance: 0,
      hasUsedReferralDiscount: false,
      rewardPoints: 50, // Welcome points
      tier: 'Silver',
      activityLogs: [
        {
          action: 'Account Created',
          details: referrerCustomer
            ? `User registered with referral code ${referrerCustomer.referralCode}`
            : 'User registered via email and password',
          timestamp: new Date(),
        },
      ],
      lastLogin: new Date(),
    });

    // ── Create permanent Referral relationship record ──
    if (referrerCustomer) {
      try {
        await Referral.create({
          referrer: referrerCustomer._id,
          referredUser: customer._id,
          referralCode: referrerCustomer.referralCode,
          status: 'pending',
          referredDiscountPercent: 15,
          referredDiscountUsed: false,
          referrerDiscountAmount: 100,
          rewardAmount: 100,
          rewardIssued: false,
          referrerDiscountAvailable: false,
          referrerDiscountUsed: false,
        });
      } catch (refErr) {
        console.warn('Failed to create Referral record:', refErr);
      }
    }

    // Sign JWT tokens (2-day access token and 24-day refresh token)
    const userPayload = {
      userId: customer._id.toString(),
      email: customer.email,
      name: customer.name,
      tier: customer.tier,
    };
    const accessToken = signUserToken(userPayload);
    const refreshToken = signUserRefreshToken(userPayload);

    // Set secure httpOnly cookies
    await setUserAuthCookie(accessToken, refreshToken);

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
          referralDiscountBalance: customer.referralDiscountBalance || 0,
          hasUsedReferralDiscount: customer.hasUsedReferralDiscount || false,
          referredBy: customer.referredBy || '',
          referralCodeUsed: customer.referralCodeUsed || '',
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
