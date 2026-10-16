import Razorpay from 'razorpay';
import crypto from 'crypto';

export function getRazorpayKeys() {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  return { keyId, keySecret };
}

let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay | null {
  const { keyId, keySecret } = getRazorpayKeys();
  if (!keyId || !keySecret) {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

/**
 * Timing-safe HMAC SHA-256 verification of Razorpay payment signature
 * Supports both verifyRazorpaySignature(orderId, paymentId, signature) and verifyRazorpaySignature({ orderId, paymentId, signature })
 */
export function verifyRazorpaySignature(
  param1: string | { orderId?: string; razorpay_order_id?: string; paymentId?: string; razorpay_payment_id?: string; signature?: string; razorpay_signature?: string },
  param2?: string,
  param3?: string
): boolean {
  try {
    let orderId = '';
    let paymentId = '';
    let signature = '';

    if (typeof param1 === 'object' && param1 !== null) {
      orderId = param1.orderId || param1.razorpay_order_id || '';
      paymentId = param1.paymentId || param1.razorpay_payment_id || '';
      signature = param1.signature || param1.razorpay_signature || '';
    } else {
      orderId = param1 || '';
      paymentId = param2 || '';
      signature = param3 || '';
    }

    const { keySecret } = getRazorpayKeys();
    if (!keySecret || !orderId || !paymentId || !signature) {
      return false;
    }

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Timing-safe HMAC SHA-256 verification of Razorpay webhook signature
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
  secret,
}: {
  rawBody: string;
  signature: string;
  secret?: string;
}): boolean {
  try {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
    if (!webhookSecret || !rawBody || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

export interface RazorpayRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  amount?: number;
  error?: string;
}

/**
 * Initiates an automated refund through Razorpay API for UPI/online payments.
 * Converts amount in rupees to paise and calls POST /v1/payments/{paymentId}/refund.
 */
export async function requestRazorpayRefund({
  paymentId,
  amountInRupees,
  notes,
}: {
  paymentId: string;
  amountInRupees: number;
  notes?: Record<string, string>;
}): Promise<RazorpayRefundResult> {
  try {
    const { keyId, keySecret } = getRazorpayKeys();
    if (!keyId || !keySecret) {
      return { success: false, error: 'Razorpay API credentials are not configured.' };
    }
    if (!paymentId) {
      return { success: false, error: 'Missing Razorpay payment ID for refund.' };
    }

    const amountInPaise = Math.round(amountInRupees * 100);
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        notes: notes || {},
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      const errDesc = data.error?.description || data.error?.reason || 'Razorpay refund failed';
      return { success: false, error: errDesc };
    }

    return {
      success: true,
      refundId: data.id,
      status: data.status || 'processed',
      amount: data.amount ? data.amount / 100 : amountInRupees,
    };
  } catch (err: any) {
    console.error('Razorpay refund request exception:', err);
    return { success: false, error: err.message || 'Refund request exception' };
  }
}
