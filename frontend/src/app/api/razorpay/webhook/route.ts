import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
    }

    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.error('❌ Razorpay Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    await connectDB();

    const eventType = event.event;
    const payload = event.payload;

    console.log(`🔔 Razorpay Webhook event received: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          if (!order.razorpayPaymentId && razorpayPaymentId) {
            order.razorpayPaymentId = razorpayPaymentId;
          }
          order.statusHistory.push({
            status: order.orderStatus,
            timestamp: new Date(),
            note: `Payment automatically confirmed via Razorpay Webhook (${eventType})`,
          });
          await order.save();
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'failed';
          order.statusHistory.push({
            status: order.orderStatus,
            timestamp: new Date(),
            note: `Payment failed via Razorpay: ${paymentEntity.error_description || 'Unknown error'}`,
          });
          await order.save();
        }
      }
    } else if (eventType === 'refund.processed') {
      const refundEntity = payload.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        const order = await Order.findOne({ razorpayPaymentId: paymentId });
        if (order) {
          order.paymentStatus = 'refunded';
          order.statusHistory.push({
            status: order.orderStatus,
            timestamp: new Date(),
            note: `Refund of ₹${(refundEntity.amount / 100).toLocaleString('en-IN')} processed via Razorpay Webhook`,
          });
          await order.save();
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
