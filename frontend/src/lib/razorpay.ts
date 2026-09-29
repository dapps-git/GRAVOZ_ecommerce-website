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
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
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
