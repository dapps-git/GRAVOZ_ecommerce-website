const Razorpay = require('razorpay');
const crypto = require('crypto');

function getRazorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  return { keyId, keySecret };
}

let razorpayInstance = null;

function getRazorpayInstance() {
  const { keyId, keySecret } = getRazorpayKeys();
  if (!keyId || !keySecret) return null;

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  try {
    const { keySecret } = getRazorpayKeys();
    if (!keySecret || !orderId || !paymentId || !signature) return false;

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

module.exports = {
  getRazorpayKeys,
  getRazorpayInstance,
  verifyRazorpaySignature,
};
