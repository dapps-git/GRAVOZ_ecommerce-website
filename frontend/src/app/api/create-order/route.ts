import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = body;

    // Validate amount (must be in paise, minimum 100 paise = ₹1)
    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum order amount is 100 paise (₹1).' },
        { status: 400 }
      );
    }

    const { keyId, keySecret } = getRazorpayKeys();
    const razorpay = getRazorpayInstance();

    if (!razorpay || !keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured' },
        { status: 401 }
      );
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(numericAmount),
      currency: currency || 'INR',
      receipt,
      notes: body.notes || {},
    });

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: keyId,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error?.error?.description || error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
