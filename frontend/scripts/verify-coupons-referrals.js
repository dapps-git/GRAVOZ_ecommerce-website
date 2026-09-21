const BASE_URL = 'http://localhost:3000';

async function testAll() {
  console.log('====================================================');
  console.log('  STARTING COUPON & REFERRAL VERIFICATION SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // PART 1: COUPON TESTS
  // ----------------------------------------------------
  console.log('--- 1. TESTING COUPON VALIDATION ---');

  // Test FIRSTSTEP
  const firststepRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'FIRSTSTEP', cartTotal: 2000, email: 'test_new_user@example.com' }),
  });
  const firststepData = await firststepRes.json();
  console.log('FIRSTSTEP Response:', firststepData);
  if (!firststepData.success || firststepData.discountAmount !== 250) {
    throw new Error(`FIRSTSTEP validation failed: ${JSON.stringify(firststepData)}`);
  }
  console.log('✔ FIRSTSTEP gives ₹250 discount correctly.');

  // Test STYLE20
  const style20Res = await fetch(`${BASE_URL}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'STYLE20', cartTotal: 2000 }),
  });
  const style20Data = await style20Res.json();
  console.log('STYLE20 Response:', style20Data);
  if (!style20Data.success || style20Data.discountAmount !== 400) {
    throw new Error(`STYLE20 validation failed: ${JSON.stringify(style20Data)}`);
  }
  console.log('✔ STYLE20 gives 20% (₹400 on ₹2000) discount correctly.');

  // Test Invalid Coupon
  const invalidRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'INVALID_COUPON_XYZ', cartTotal: 1000 }),
  });
  const invalidData = await invalidRes.json();
  console.log('Invalid Coupon Response:', invalidData);
  if (invalidData.success) {
    throw new Error('Invalid coupon was incorrectly accepted!');
  }
  console.log('✔ Invalid coupon correctly rejected.');


  // ----------------------------------------------------
  // PART 2: REFERRAL SYSTEM END-TO-END FLOW
  // ----------------------------------------------------
  console.log('\n--- 2. TESTING REFERRAL SYSTEM END-TO-END ---');

  const ts = Date.now();
  const userAEmail = `user_a_${ts}@gravoz-test.com`;
  const userBEmail = `user_b_${ts}@gravoz-test.com`;
  const password = 'TestPassword#123';

  // Step 2.1: Register User A (Referrer)
  console.log('\n[Step 2.1] Registering User A (Referrer)...');
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User A', email: userAEmail, password }),
  });
  const regAData = await regARes.json();
  if (!regAData.success || !regAData.user?.referralCode) {
    throw new Error(`User A registration failed: ${JSON.stringify(regAData)}`);
  }
  const userACookie = regARes.headers.get('set-cookie') || '';
  const refCodeA = regAData.user.referralCode;
  console.log(`✔ User A registered. Referral Code: ${refCodeA}`);

  // Step 2.2: Validate User A's referral code
  console.log(`\n[Step 2.2] Validating referral code "${refCodeA}"...`);
  const valRes = await fetch(`${BASE_URL}/api/referrals/validate?code=${refCodeA}`);
  const valData = await valRes.json();
  console.log('Validation result:', valData);
  if (!valData.valid || valData.discountPercent !== 15) {
    throw new Error(`Referral validation failed: ${JSON.stringify(valData)}`);
  }
  console.log('✔ Referral code validated successfully with 15% discount promise.');

  // Step 2.3: Verify Self-Referral Prevention
  console.log('\n[Step 2.3] Testing self-referral prevention...');
  const selfValRes = await fetch(`${BASE_URL}/api/referrals/validate?code=${refCodeA}`, {
    headers: { Cookie: userACookie },
  });
  const selfValData = await selfValRes.json();
  console.log('Self-validation result:', selfValData);
  if (selfValData.valid) {
    throw new Error('Self referral was NOT blocked!');
  }
  console.log('✔ Self-referral correctly blocked.');

  // Step 2.4: Register User B (Friend) with User A's referral code
  console.log(`\n[Step 2.4] Registering User B using referral code "${refCodeA}"...`);
  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User B',
      email: userBEmail,
      password,
      referralCode: refCodeA,
    }),
  });
  const regBData = await regBRes.json();
  if (!regBData.success) {
    throw new Error(`User B registration failed: ${JSON.stringify(regBData)}`);
  }
  const userBCookie = regBRes.headers.get('set-cookie') || '';
  console.log(`✔ User B registered with referral code ${refCodeA}.`);

  // Step 2.5: Check User A's referral status (Should show 1 friend joined, 0 successful orders, ₹0 available)
  console.log('\n[Step 2.5] Checking User A dashboard status before friend order...');
  const statusA1Res = await fetch(`${BASE_URL}/api/referrals/status`, {
    headers: { Cookie: userACookie },
  });
  const statusA1 = await statusA1Res.json();
  console.log('User A Status before purchase:', {
    friendsJoined: statusA1.stats?.totalReferred,
    successfulOrders: statusA1.stats?.completedOrders,
    availableDiscount: statusA1.availableDiscount,
  });
  if (statusA1.stats?.totalReferred !== 1 || statusA1.stats?.completedOrders !== 0 || statusA1.availableDiscount !== 0) {
    throw new Error(`Unexpected User A status before purchase: ${JSON.stringify(statusA1)}`);
  }
  console.log('✔ User A dashboard correctly shows: Friends Joined: 1, Successful Orders: 0, Available Discount: ₹0.');

  // Fetch an actual in-stock product from DB
  const prodRes = await fetch(`${BASE_URL}/api/products`);
  const prodData = await prodRes.json();
  const testProduct = prodData.products?.[0] || { _id: undefined, name: 'Shoes', price: 2000 };
  const realProductId = testProduct._id;
  const productPrice = Number(testProduct.price) || 2000;

  // Step 2.6: User B places first order with 15% discount
  console.log('\n[Step 2.6] User B placing first order with 15% referral discount...');
  const orderBPayload = {
    customerId: regBData.user.id,
    customerEmail: userBEmail,
    customerName: 'User B',
    shippingAddress: {
      name: 'User B',
      phone: '9876543210',
      street: '456 Friend St',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
    },
    items: [
      {
        productId: realProductId,
        name: testProduct.name || 'Footwear',
        price: productPrice,
        quantity: 1,
        selectedSize: '8',
        selectedColor: 'Black',
      },
    ],
    subtotal: productPrice,
    discountAmount: 0,
    referralDiscountType: 'referred_first_order_15',
    shippingFee: 0,
    totalAmount: Math.round(productPrice * 0.85),
    paymentMethod: 'COD',
  };

  const orderBRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userBCookie,
    },
    body: JSON.stringify(orderBPayload),
  });
  const orderBData = await orderBRes.json();
  console.log('User B Order Placement result:', {
    orderNumber: orderBData.order?.orderNumber,
    subtotal: orderBData.order?.subtotal,
    referralDiscountAmount: orderBData.order?.referralDiscountAmount,
    totalAmount: orderBData.order?.totalAmount,
  });
  const expectedBDiscount = Math.round(productPrice * 0.15);
  const expectedBTotal = productPrice - expectedBDiscount;
  if (!orderBData.success || orderBData.order?.referralDiscountAmount !== expectedBDiscount || orderBData.order?.totalAmount !== expectedBTotal) {
    throw new Error(`User B order placement failed or discount incorrect: ${JSON.stringify(orderBData)}`);
  }
  console.log(`✔ User B received 15% discount (₹${expectedBDiscount} off on ₹${productPrice}), total paid: ₹${expectedBTotal}.`);

  // Step 2.7: Check User A's referral status (Should now show 1 successful order, ₹100 Available Discount!)
  console.log('\n[Step 2.7] Checking User A dashboard status after friend order completed...');
  const statusA2Res = await fetch(`${BASE_URL}/api/referrals/status`, {
    headers: { Cookie: userACookie },
  });
  const statusA2 = await statusA2Res.json();
  console.log('User A Status after purchase:', {
    friendsJoined: statusA2.stats?.totalReferred,
    successfulOrders: statusA2.stats?.completedOrders,
    availableDiscount: statusA2.availableDiscount,
    referralDiscountBalance: statusA2.referralDiscountBalance,
  });
  if (statusA2.stats?.completedOrders !== 1 || statusA2.availableDiscount !== 100) {
    throw new Error(`User A reward not credited! ${JSON.stringify(statusA2)}`);
  }
  console.log('✔ User A successfully earned ₹100 reward! Available Discount is now ₹100.');

  // Step 2.8: User A places order using ₹100 referral reward
  console.log('\n[Step 2.8] User A placing order and applying ₹100 referral reward...');
  const orderAPayload = {
    customerId: regAData.user.id,
    customerEmail: userAEmail,
    customerName: 'User A',
    shippingAddress: {
      name: 'User A',
      phone: '9123456780',
      street: '123 Referrer St',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
    },
    items: [
      {
        productId: realProductId,
        name: testProduct.name || 'Footwear',
        price: productPrice,
        quantity: 1,
        selectedSize: '9',
        selectedColor: 'Brown',
      },
    ],
    subtotal: productPrice,
    discountAmount: 0,
    referralDiscountType: 'referrer_reward_100',
    shippingFee: 0,
    totalAmount: Math.max(0, productPrice - 100),
    paymentMethod: 'COD',
  };

  const orderARes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userACookie,
    },
    body: JSON.stringify(orderAPayload),
  });
  const orderAData = await orderARes.json();
  console.log('User A Order Placement result:', {
    orderNumber: orderAData.order?.orderNumber,
    subtotal: orderAData.order?.subtotal,
    referralDiscountAmount: orderAData.order?.referralDiscountAmount,
    totalAmount: orderAData.order?.totalAmount,
  });
  const expectedATotal = productPrice - 100;
  if (!orderAData.success || orderAData.order?.referralDiscountAmount !== 100 || orderAData.order?.totalAmount !== expectedATotal) {
    throw new Error(`User A order placement failed or ₹100 discount incorrect: ${JSON.stringify(orderAData)}`);
  }
  console.log(`✔ User A successfully used ₹100 reward (₹100 off on ₹${productPrice}), total paid: ₹${expectedATotal}.`);

  // Step 2.9: Verify User A balance is now 0
  const statusA3Res = await fetch(`${BASE_URL}/api/referrals/status`, {
    headers: { Cookie: userACookie },
  });
  const statusA3 = await statusA3Res.json();
  console.log('\n[Step 2.9] User A Status after using reward:', {
    availableDiscount: statusA3.availableDiscount,
  });
  if (statusA3.availableDiscount !== 0) {
    throw new Error(`User A balance should be 0 after usage, got: ${statusA3.availableDiscount}`);
  }
  console.log('✔ User A balance correctly decremented to ₹0.');

  // Step 2.10: Cancellation & Restoration test
  console.log('\n[Step 2.10] Cancelling User A order to verify ₹100 reward balance restoration...');
  const cancelRes = await fetch(`${BASE_URL}/api/orders/${orderAData.order._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: userACookie,
    },
    body: JSON.stringify({ action: 'cancel' }),
  });
  const cancelData = await cancelRes.json();
  if (!cancelData.success || cancelData.order?.orderStatus !== 'cancelled') {
    throw new Error(`Order cancellation failed: ${JSON.stringify(cancelData)}`);
  }

  const statusA4Res = await fetch(`${BASE_URL}/api/referrals/status`, {
    headers: { Cookie: userACookie },
  });
  const statusA4 = await statusA4Res.json();
  console.log('User A Status after order cancelled:', {
    availableDiscount: statusA4.availableDiscount,
  });
  if (statusA4.availableDiscount !== 100) {
    throw new Error(`User A reward was NOT restored upon order cancellation! Balance: ${statusA4.availableDiscount}`);
  }
  console.log('✔ User A reward successfully restored to ₹100 upon cancellation!');

  console.log('\n====================================================');
  console.log('  ALL COUPON & REFERRAL TESTS PASSED (100% SUCCESS) ');
  console.log('====================================================\n');
}

testAll().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
