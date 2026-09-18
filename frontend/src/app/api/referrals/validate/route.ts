import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Customer } from '@/models/Customer';
import { getUserSession } from '@/lib/auth';

// POST /api/referrals/validate
// Body: { code: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { valid: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    await connectDB();

    // Find the referring customer by referralCode
    const referrer = await Customer.findOne({
      referralCode: cleanCode,
      isActive: true,
    })
      .select('_id name email referralCode isActive')
      .lean();

    if (!referrer) {
      return NextResponse.json(
        {
          valid: false,
          error: `Referral code "${cleanCode}" is invalid or does not exist.`,
        },
        { status: 404 }
      );
    }

    // Check if the current logged-in user is trying to refer themselves or has already used a referral code
    const session = await getUserSession();
    if (session) {
      if (session.userId === referrer._id.toString()) {
        return NextResponse.json(
          {
            valid: false,
            error: 'You cannot use your own referral code.',
          },
          { status: 400 }
        );
      }

      const currentCustomer = await Customer.findById(session.userId);
      if (currentCustomer) {
        if (currentCustomer.hasUsedReferralDiscount) {
          return NextResponse.json(
            {
              valid: false,
              error: 'You have already used a referral code. Referral discounts can only be used once per account.',
            },
            { status: 400 }
          );
        }

        if ((currentCustomer.totalOrders || 0) > 0) {
          return NextResponse.json(
            {
              valid: false,
              error: 'Referral discount is only valid on your first order.',
            },
            { status: 400 }
          );
        }

        const { Order } = await import('@/models/Order');
        const priorOrdersCount = await Order.countDocuments({
          $or: [
            { customerId: currentCustomer._id.toString() },
            { customerEmail: currentCustomer.email.toLowerCase().trim() },
          ],
          orderStatus: { $ne: 'cancelled' },
        });

        if (priorOrdersCount > 0) {
          return NextResponse.json(
            {
              valid: false,
              error: 'Referral discount is only valid on your first order.',
            },
            { status: 400 }
          );
        }

        if (currentCustomer.referredBy || currentCustomer.referralCodeUsed) {
          return NextResponse.json(
            {
              valid: false,
              error: 'A referral code has already been applied to your account. You can only use a referral code once.',
            },
            { status: 400 }
          );
        }

        const { Referral } = await import('@/models/Referral');
        const existingReferral = await Referral.findOne({ referredUser: currentCustomer._id });
        if (existingReferral) {
          return NextResponse.json(
            {
              valid: false,
              error: 'A referral code has already been applied to your account.',
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({
      valid: true,
      referralCode: referrer.referralCode,
      referrerName: referrer.name.split(' ')[0], // First name for a friendly display
      discountPercent: 15,
      message: `Valid referral code from ${referrer.name.split(' ')[0]}! You will get 15% OFF your first order.`,
    });
  } catch (error: any) {
    console.error('Referral validate error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}

// GET /api/referrals/validate?code=AIFA100
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code || !code.trim()) {
      return NextResponse.json(
        { valid: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    await connectDB();

    const referrer = await Customer.findOne({
      referralCode: cleanCode,
      isActive: true,
    })
      .select('_id name email referralCode isActive')
      .lean();

    if (!referrer) {
      return NextResponse.json(
        {
          valid: false,
          error: `Referral code "${cleanCode}" is invalid or does not exist.`,
        },
        { status: 404 }
      );
    }

    const session = await getUserSession();
    if (session) {
      if (session.userId === referrer._id.toString()) {
        return NextResponse.json(
          {
            valid: false,
            error: 'You cannot use your own referral code.',
          },
          { status: 400 }
        );
      }

      const currentCustomer = await Customer.findById(session.userId);
      if (currentCustomer) {
        if (currentCustomer.hasUsedReferralDiscount) {
          return NextResponse.json(
            {
              valid: false,
              error: 'You have already used a referral code. Referral discounts can only be used once per account.',
            },
            { status: 400 }
          );
        }

        if ((currentCustomer.totalOrders || 0) > 0) {
          return NextResponse.json(
            {
              valid: false,
              error: 'Referral discount is only valid on your first order.',
            },
            { status: 400 }
          );
        }

        const { Order } = await import('@/models/Order');
        const priorOrdersCount = await Order.countDocuments({
          $or: [
            { customerId: currentCustomer._id.toString() },
            { customerEmail: currentCustomer.email.toLowerCase().trim() },
          ],
          orderStatus: { $ne: 'cancelled' },
        });

        if (priorOrdersCount > 0) {
          return NextResponse.json(
            {
              valid: false,
              error: 'Referral discount is only valid on your first order.',
            },
            { status: 400 }
          );
        }

        if (currentCustomer.referredBy || currentCustomer.referralCodeUsed) {
          return NextResponse.json(
            {
              valid: false,
              error: 'A referral code has already been applied to your account. You can only use a referral code once.',
            },
            { status: 400 }
          );
        }

        const { Referral } = await import('@/models/Referral');
        const existingReferral = await Referral.findOne({ referredUser: currentCustomer._id });
        if (existingReferral) {
          return NextResponse.json(
            {
              valid: false,
              error: 'A referral code has already been applied to your account.',
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({
      valid: true,
      referralCode: referrer.referralCode,
      referrerName: referrer.name.split(' ')[0],
      discountPercent: 15,
      message: `Valid referral code from ${referrer.name.split(' ')[0]}! You will get 15% OFF your first order.`,
    });
  } catch (error: any) {
    console.error('Referral validate GET error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}
