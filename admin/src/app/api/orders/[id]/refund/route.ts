import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized admin session' }, { status: 401 });
    }

    const params = await props.params;
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const targetStatus = body?.targetStatus === 'refund_initiated' ? 'refund_initiated' : 'refunded';

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'refunded' && order.paymentDetails?.refundId) {
      return NextResponse.json(
        { error: `This order has already been refunded via Razorpay (Refund ID: ${order.paymentDetails.refundId}).` },
        { status: 400 }
      );
    }

    const isCod = order.paymentMethod === 'COD';
    let refundResult: any = null;

    if (!isCod) {
      // Online Payment Refund via Razorpay API (Reverses money back to customer's UPI VPA / Bank Account)
      const paymentId = order.razorpayPaymentId || order.transactionId;
      if (!paymentId) {
        return NextResponse.json(
          { error: 'No Razorpay payment ID (pay_...) found on this order. Please check order transaction details.' },
          { status: 400 }
        );
      }

      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_ThoKT60JX1kpL8';
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'H13PuysOoGUC6q7JluZMsNnK';

      if (!keyId || !keySecret) {
        return NextResponse.json({ error: 'Razorpay API credentials are not configured.' }, { status: 500 });
      }

      // Convert total amount to paise (e.g. ₹1.00 = 100 paise)
      const amountInPaise = Math.round(order.totalAmount * 100);

      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          notes: {
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail || '',
            reason: 'Initiated from GRAVOZ Admin Panel by admin double-check confirmation',
          },
        }),
      });

      const rzpData = await rzpRes.json();
      if (!rzpRes.ok || rzpData.error) {
        const errorDesc = rzpData.error?.description || rzpData.error?.reason || 'Razorpay refund failed';
        console.error('Razorpay refund error:', rzpData);
        return NextResponse.json({ error: `Razorpay Error: ${errorDesc}` }, { status: 400 });
      }

      refundResult = rzpData;
    }

    const refundId = refundResult?.id || `manual_ref_${Date.now()}`;
    const now = new Date();

    // If Razorpay processed the reversal immediately to bank, automatically mark status as 'refunded'
    const finalStatus = (refundResult?.status === 'processed' || targetStatus === 'refunded')
      ? 'refunded'
      : 'refund_initiated';

    order.orderStatus = finalStatus;
    order.paymentStatus = 'refunded';

    if (!order.paymentDetails) order.paymentDetails = {};
    order.paymentDetails.refundId = refundId;
    order.paymentDetails.refundStatus = refundResult?.status || 'processed';
    order.paymentDetails.refundAmount = order.totalAmount;
    order.paymentDetails.refundedAt = now;
    order.markModified('paymentDetails');

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: finalStatus,
      timestamp: now,
      note: isCod
        ? `Cash / Manual refund marked as ${finalStatus === 'refund_initiated' ? 'Refund Initiated' : 'Refunded'} by admin.`
        : `Razorpay UPI/Bank Refund (${refundId}) processed successfully. ₹${order.totalAmount} reversed directly to customer's bank account.`,
    });

    if (order.returnDetails) {
      order.returnDetails.status = finalStatus;
      order.returnDetails.refundedAt = now;
      if (finalStatus === 'refund_initiated') {
        order.returnDetails.refundInitiatedAt = now;
      }
    }

    await order.save();

    const statusLabel = finalStatus === 'refund_initiated' ? 'Refund Initiated' : 'Refund Completed';

    return NextResponse.json({
      success: true,
      refundId,
      order,
      message: isCod
        ? `Order marked as ${statusLabel} (Manual COD).`
        : `✓ Refund of ₹${order.totalAmount} sent to customer's bank account via Razorpay! (${statusLabel} - Gateway ID: ${refundId})`,
    });
  } catch (error: any) {
    console.error('Refund processing error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error while processing refund' }, { status: 500 });
  }
}
