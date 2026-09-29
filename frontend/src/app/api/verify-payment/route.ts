import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order_id = body.order_id || body.razorpay_order_id;
    const payment_id = body.payment_id || body.razorpay_payment_id;
    const signature = body.razorpay_signature || body.signature;

    if (!order_id || !payment_id || !signature) {
      return NextResponse.json(
        { error: 'Missing required parameters: order_id, payment_id, and signature are required.' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature(order_id, payment_id, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.', verified: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Payment verified successfully.',
      order_id,
      payment_id,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify payment signature' },
      { status: 500 }
    );
  }
}
