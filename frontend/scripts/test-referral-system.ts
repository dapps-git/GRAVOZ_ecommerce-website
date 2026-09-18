import fs from 'fs';
import path from 'path';

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
} catch (e) {
  console.warn('Could not read .env.local', e);
}

import mongoose from 'mongoose';
import Customer from '../src/models/Customer';
import Referral from '../src/models/Referral';
import Order from '../src/models/Order';
import connectDB from '../src/lib/db';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- Starting Referral System Verification ---');
  await connectDB();

  const timestamp = Date.now();
  const referrerEmail = `test_aifa_${timestamp}@gravoztest.com`;
  const friendEmail = `test_rahul_${timestamp}@gravoztest.com`;
  const referrerName = 'Aifa Tester';
  const friendName = 'Rahul Friend';
  const password = 'Password@123';

  let referrerCode = '';
  let rahulOrderId = '';
  let aifaOrderId = '';

  try {
    // 1. Register Referrer Aifa
    console.log('\n[1] Registering Referrer:', referrerEmail);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: referrerName,
        email: referrerEmail,
        password,
      }),
    });
    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      throw new Error(`Referrer registration failed: ${JSON.stringify(regData)}`);
    }

    const referrerCookie = regRes.headers.get('set-cookie') || '';
    referrerCode = regData.user.referralCode;
    console.log('Referrer created successfully. Code:', referrerCode);
    if (!referrerCode || !/^[A-Z0-9]+$/.test(referrerCode)) {
      throw new Error(`Invalid referral code generated: ${referrerCode}`);
    }

    // 2. Validate referral code (Anonymous) via GET
    console.log('\n[2] Validating referral code anonymously via GET:', referrerCode);
    const valRes = await fetch(`${BASE_URL}/api/referrals/validate?code=${referrerCode}`);
    const valData = await valRes.json();
    console.log('Anonymous validation response:', valData);
    if (!valData.valid || !valData.referrerName) {
      throw new Error('Validation failed for valid referral code');
    }

    // Also test POST /api/referrals/validate
    const valPostRes = await fetch(`${BASE_URL}/api/referrals/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: referrerCode }),
    });
    const valPostData = await valPostRes.json();
    if (!valPostData.valid) {
      throw new Error('POST validation failed for valid referral code');
    }
    console.log('POST validation also succeeded.');

    // 3. Test self-referral prevention (Logged-in referrer)
    console.log('\n[3] Testing self-referral prevention with session cookie...');
    const selfValRes = await fetch(`${BASE_URL}/api/referrals/validate?code=${referrerCode}`, {
      headers: referrerCookie ? { Cookie: referrerCookie } : {},
    });
    const selfValData = await selfValRes.json();
    console.log('Self-validation response:', selfValData);
    if (selfValData.valid) {
      throw new Error('Self-referral was NOT blocked!');
    }
    console.log('Self-referral correctly blocked:', selfValData.error);

    // 4. Register Friend Rahul using referrer's code
    console.log('\n[4] Registering friend Rahul with referralCode:', referrerCode);
    const friendRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: friendName,
        email: friendEmail,
        password,
        referralCode: referrerCode,
      }),
    });
    const friendRegData = await friendRegRes.json();
    if (!friendRegRes.ok || !friendRegData.success) {
      throw new Error(`Friend registration failed: ${JSON.stringify(friendRegData)}`);
    }
    const friendCookie = friendRegRes.headers.get('set-cookie') || '';
    console.log('Friend registered successfully. Referral tracking verified.');

    // Verify Referral collection record in DB
    const referralRecord = await Referral.findOne({ referralCode: referrerCode, status: 'pending' });
    if (!referralRecord) {
      throw new Error('Referral record was not created in DB with status pending!');
    }
    console.log('DB Referral record confirmed:', {
      status: referralRecord.status,
      referredDiscountPercent: referralRecord.referredDiscountPercent,
      referrerDiscountAmount: referralRecord.referrerDiscountAmount,
    });

    // 5. Check Rahul's status endpoint for first-order discount eligibility (15%)
    console.log('\n[5] Checking Rahul status via /api/referrals/status');
    const rahulStatusRes = await fetch(`${BASE_URL}/api/referrals/status`, {
      headers: friendCookie ? { Cookie: friendCookie } : {},
    });
    const rahulStatus = await rahulStatusRes.json();
    console.log('Rahul status:', {
      eligibleForFirstOrderDiscount: rahulStatus.eligibleForFirstOrderDiscount,
      firstOrderDiscountPercent: rahulStatus.firstOrderDiscountPercent,
    });
    if (!rahulStatus.eligibleForFirstOrderDiscount || rahulStatus.firstOrderDiscountPercent !== 15) {
      throw new Error('Rahul is not marked eligible for 15% first order discount!');
    }

    // 6. Rahul places first order with 15% referral discount
    console.log('\n[6] Rahul placing first order with 15% referral discount');
    const orderItems = [
      {
        productId: 'sku-oxford-italian-01',
        name: 'GRAVOZ Italian Oxford Classic',
        price: 2000,
        quantity: 1,
        size: '9',
        color: 'Brown',
      },
    ];

    const rahulOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(friendCookie ? { Cookie: friendCookie } : {}),
      },
      body: JSON.stringify({
        items: orderItems,
        subtotal: 2000,
        shippingFee: 0,
        totalAmount: 1700,
        customerName: friendName,
        customerEmail: friendEmail,
        customerPhone: '9876543210',
        shippingAddress: {
          name: friendName,
          phone: '9876543210',
          street: '123 Test St',
          city: 'Calicut',
          state: 'Kerala',
          postalCode: '673001',
          country: 'India',
        },
        paymentMethod: 'COD',
        referralDiscountType: 'referred_first_order_15',
        referralDiscountAmount: 300,
      }),
    });

    const rahulOrderData = await rahulOrderRes.json();
    if (!rahulOrderRes.ok || !rahulOrderData.success) {
      throw new Error(`Rahul order creation failed: ${JSON.stringify(rahulOrderData)}`);
    }
    rahulOrderId = rahulOrderData.order._id;
    console.log('Rahul order created successfully:', {
      subtotal: rahulOrderData.order.subtotal,
      referralDiscountAmount: rahulOrderData.order.referralDiscountAmount,
      referralDiscountType: rahulOrderData.order.referralDiscountType,
      totalAmount: rahulOrderData.order.totalAmount,
    });

    // 15% of 2000 is 300. Total should be 1700.
    if (rahulOrderData.order.referralDiscountAmount !== 300 || rahulOrderData.order.totalAmount !== 1700) {
      throw new Error(`Discount calculation incorrect! Expected discount 300, total 1700. Got discount ${rahulOrderData.order.referralDiscountAmount}, total ${rahulOrderData.order.totalAmount}`);
    }

    // 7. Verify Referrer Aifa receives ₹100 discount reward
    console.log('\n[7] Verifying Referrer Aifa received ₹100 discount reward');
    const aifaCust = await Customer.findOne({ email: referrerEmail });
    if (!aifaCust || aifaCust.referralDiscountBalance !== 100) {
      throw new Error(`Referrer discount balance expected 100, got: ${aifaCust?.referralDiscountBalance}`);
    }
    console.log('Referrer balance in DB:', aifaCust.referralDiscountBalance);

    // Verify Aifa's status endpoint
    const aifaStatusRes = await fetch(`${BASE_URL}/api/referrals/status`, {
      headers: referrerCookie ? { Cookie: referrerCookie } : {},
    });
    const aifaStatus = await aifaStatusRes.json();
    console.log('Aifa status response:', {
      availableDiscountRupees: aifaStatus.availableDiscountRupees,
      stats: aifaStatus.stats,
      historyCount: aifaStatus.history?.length,
    });
    if (aifaStatus.availableDiscountRupees !== 100 || aifaStatus.stats.completedReferrals !== 1) {
      throw new Error('Aifa status endpoint did not report ₹100 available discount or 1 completed referral!');
    }

    // 8. Referrer Aifa places order applying ₹100 referral discount
    console.log('\n[8] Referrer Aifa placing order applying ₹100 referral discount');
    const aifaOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(referrerCookie ? { Cookie: referrerCookie } : {}),
      },
      body: JSON.stringify({
        items: [
          {
            productId: 'sku-derby-tan-02',
            name: 'GRAVOZ Derby Classic',
            price: 1500,
            quantity: 1,
            size: '8',
            color: 'Tan',
          },
        ],
        subtotal: 1500,
        shippingFee: 0,
        totalAmount: 1400,
        customerName: referrerName,
        customerEmail: referrerEmail,
        customerPhone: '9876543211',
        shippingAddress: {
          name: referrerName,
          phone: '9876543211',
          street: '456 Test Ave',
          city: 'Calicut',
          state: 'Kerala',
          postalCode: '673001',
          country: 'India',
        },
        paymentMethod: 'COD',
        referralDiscountType: 'referrer_reward_100',
        referralDiscountAmount: 100,
      }),
    });

    const aifaOrderData = await aifaOrderRes.json();
    if (!aifaOrderRes.ok || !aifaOrderData.success) {
      throw new Error(`Aifa order creation failed: ${JSON.stringify(aifaOrderData)}`);
    }
    aifaOrderId = aifaOrderData.order._id;
    console.log('Aifa order created successfully:', {
      subtotal: aifaOrderData.order.subtotal,
      referralDiscountAmount: aifaOrderData.order.referralDiscountAmount,
      totalAmount: aifaOrderData.order.totalAmount,
    });

    if (aifaOrderData.order.referralDiscountAmount !== 100 || aifaOrderData.order.totalAmount !== 1400) {
      throw new Error(`Aifa order calculation incorrect! Expected discount 100, total 1400.`);
    }

    // Check Aifa's balance is reset to 0
    const aifaCustAfterOrder = await Customer.findOne({ email: referrerEmail });
    if (aifaCustAfterOrder?.referralDiscountBalance !== 0) {
      throw new Error(`Aifa referralDiscountBalance expected 0 after use, got: ${aifaCustAfterOrder?.referralDiscountBalance}`);
    }
    console.log('Aifa balance correctly reset to 0 after redemption.');

    // 9. Cancellation & Refund Abuse Protection Test
    console.log('\n[9] Testing order cancellation and discount restoration...');
    const cancelRes = await fetch(`${BASE_URL}/api/orders/${aifaOrderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(referrerCookie ? { Cookie: referrerCookie } : {}),
      },
      body: JSON.stringify({ action: 'cancel' }),
    });
    const cancelData = await cancelRes.json();
    console.log('Cancellation result:', cancelData);

    const aifaCustAfterCancel = await Customer.findOne({ email: referrerEmail });
    if (aifaCustAfterCancel?.referralDiscountBalance !== 100) {
      throw new Error(`Aifa referral discount was NOT restored upon order cancellation! Balance: ${aifaCustAfterCancel?.referralDiscountBalance}`);
    }
    console.log('Aifa referral discount successfully restored to ₹100 upon cancellation!');

    console.log('\n===========================================');
    console.log('ALL REFERRAL SYSTEM TESTS PASSED PERFECTLY!');
    console.log('===========================================');
  } finally {
    // Cleanup test data
    console.log('\nCleaning up test records from database...');
    await Customer.deleteMany({ email: { $in: [referrerEmail, friendEmail] } });
    if (referrerCode) await Referral.deleteMany({ referralCode: referrerCode });
    if (rahulOrderId) await Order.findByIdAndDelete(rahulOrderId);
    if (aifaOrderId) await Order.findByIdAndDelete(aifaOrderId);
    console.log('Cleanup completed.');
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
