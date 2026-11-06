const Order    = require('../models/Order');
const Customer = require('../models/Customer');
const Cart     = require('../models/Cart');
const Product  = require('../models/Product');
const Coupon   = require('../models/Coupon');
const Setting  = require('../models/Setting');
const mongoose = require('mongoose');
const {
  calculateAndRecordAffiliateCommission,
  syncAffiliateCommissionOnOrderStatusChange,
} = require('../utils/affiliateCommission');
const {
  getRazorpayInstance,
  getRazorpayKeys,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  requestRazorpayRefund,
} = require('../utils/razorpay');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Server-side recalculation and stock validation of order items and discounts
 */
async function calculateVerifiedOrderTotals({ items, couponCode, shippingFee = 0, isCod = false }) {
  let verifiedSubtotal = 0;
  const validatedItems = [];

  for (const itm of items) {
    const pid = itm.productId || itm.id || itm._id;
    let unitPrice = Number(itm.price) || 0;
    const qty = Math.max(1, Number(itm.quantity) || 1);

    if (pid && mongoose.Types.ObjectId.isValid(pid)) {
      const prod = await Product.findById(pid).lean();
      if (!prod || (prod.stock !== undefined && prod.stock <= 0)) {
        throw new Error(`Item "${itm.name || prod?.name || 'Product'}" is currently out of stock.`);
      }
      const disc = Number(prod.discountPrice);
      const reg = Number(prod.price);
      if (!isNaN(disc) && disc > 0) {
        unitPrice = disc;
      } else if (!isNaN(reg) && reg > 0) {
        unitPrice = reg;
      }
    }

    verifiedSubtotal += unitPrice * qty;
    validatedItems.push({
      productId: String(pid),
      name: itm.name || itm.title || 'Product',
      price: unitPrice,
      originalPrice: itm.originalPrice ? Number(itm.originalPrice) : undefined,
      quantity: qty,
      size: itm.size || '',
      color: itm.color || '',
      imageUrl: itm.imageUrl || '',
    });
  }

  // Coupon validation
  let verifiedCouponDiscount = 0;
  if (couponCode) {
    const cleanCoupon = String(couponCode).toUpperCase().trim();
    if (cleanCoupon === 'FIRSTSTEP') {
      const dbCoupon = await Coupon.findOne({ code: 'FIRSTSTEP', isActive: true });
      const val = dbCoupon ? dbCoupon.value : 250;
      const minReq = dbCoupon ? dbCoupon.minPurchaseAmount : 0;
      if (verifiedSubtotal >= minReq) {
        verifiedCouponDiscount = Math.min(val, verifiedSubtotal);
      }
    } else if (cleanCoupon === 'STYLE20') {
      verifiedCouponDiscount = Math.round(verifiedSubtotal * 0.2);
    } else {
      const dbCoupon = await Coupon.findOne({
        code: cleanCoupon,
        isActive: true,
        expiryDate: { $gte: new Date() },
      });
      if (dbCoupon && dbCoupon.usedCount < dbCoupon.totalUsageLimit && verifiedSubtotal >= dbCoupon.minPurchaseAmount) {
        if (dbCoupon.type === 'percentage') {
          let disc = Math.round((verifiedSubtotal * dbCoupon.value) / 100);
          if (dbCoupon.maxDiscountAmount) disc = Math.min(disc, dbCoupon.maxDiscountAmount);
          verifiedCouponDiscount = disc;
        } else {
          verifiedCouponDiscount = Math.min(dbCoupon.value, verifiedSubtotal);
        }
      }
    }
  }

  let finalShippingFee = Number(shippingFee) || 0;
  if (isCod && finalShippingFee === 0) {
    try {
      const setting = await Setting.findOne().lean();
      finalShippingFee = setting?.codDeliveryCharge !== undefined ? Number(setting.codDeliveryCharge) : 25;
    } catch {
      finalShippingFee = 25;
    }
  }

  const verifiedTotal = Math.max(0, verifiedSubtotal - verifiedCouponDiscount + finalShippingFee);

  return {
    verifiedSubtotal,
    verifiedCouponDiscount,
    verifiedShippingFee: finalShippingFee,
    verifiedTotal,
    validatedItems,
  };
}

/**
 * Decrement product stock across main stock, sizeAvailability, and colorVariants
 */
async function decrementOrderInventory(items) {
  if (!Array.isArray(items)) return;
  for (const itm of items) {
    const pid = itm.productId || itm.id || itm._id;
    if (pid && mongoose.Types.ObjectId.isValid(pid)) {
      const qty = Number(itm.quantity || 1);
      const itemSize = String(itm.size || '').trim();
      const itemColor = String(itm.color || '').trim().toLowerCase();
      const prodDoc = await Product.findById(pid);
      if (prodDoc) {
        prodDoc.stock = Math.max(0, (prodDoc.stock || 0) - qty);

        if (itemSize && Array.isArray(prodDoc.sizeAvailability)) {
          const sObj = prodDoc.sizeAvailability.find((s) => String(s.size).trim() === itemSize);
          if (sObj) {
            const currentStock = sObj.stock !== undefined ? sObj.stock : Math.max(0, prodDoc.stock || 0);
            sObj.stock = Math.max(0, currentStock - qty);
            if (sObj.stock === 0) sObj.isAvailable = false;
          }
          prodDoc.markModified('sizeAvailability');
        }

        if (itemColor && Array.isArray(prodDoc.colorVariants)) {
          const vObj = prodDoc.colorVariants.find(
            (v) => String(v.name || '').trim().toLowerCase() === itemColor
          );
          if (vObj) {
            const currentVStock = vObj.stock !== undefined ? vObj.stock : 10;
            vObj.stock = Math.max(0, currentVStock - qty);
            if (vObj.stock === 0) vObj.isAvailable = false;

            if (itemSize && Array.isArray(vObj.sizes)) {
              const vsObj = vObj.sizes.find((s) => String(s.size).trim() === itemSize);
              if (vsObj) {
                const currentVSStock = vsObj.stock !== undefined ? vsObj.stock : 10;
                vsObj.stock = Math.max(0, currentVSStock - qty);
                if (vsObj.stock === 0) vsObj.isAvailable = false;
              }
            }
          }
          prodDoc.markModified('colorVariants');
        }

        await prodDoc.save();
      }
    }
  }
}

/**
 * Restore product stock across main stock, sizeAvailability, and colorVariants upon order cancellation
 */
async function restoreOrderInventory(items) {
  if (!Array.isArray(items)) return;
  for (const itm of items) {
    const pid = itm.productId || itm.id || itm._id;
    if (pid && mongoose.Types.ObjectId.isValid(pid)) {
      const qty = Number(itm.quantity || 1);
      const itemSize = String(itm.size || '').trim();
      const itemColor = String(itm.color || '').trim().toLowerCase();
      const prodDoc = await Product.findById(pid);
      if (prodDoc) {
        prodDoc.stock = (prodDoc.stock || 0) + qty;

        if (itemSize && Array.isArray(prodDoc.sizeAvailability)) {
          const sObj = prodDoc.sizeAvailability.find((s) => String(s.size).trim() === itemSize);
          if (sObj) {
            sObj.stock = (sObj.stock || 0) + qty;
            if (sObj.stock > 0) sObj.isAvailable = true;
          }
          prodDoc.markModified('sizeAvailability');
        }

        if (itemColor && Array.isArray(prodDoc.colorVariants)) {
          const vObj = prodDoc.colorVariants.find(
            (v) => String(v.name || '').trim().toLowerCase() === itemColor
          );
          if (vObj) {
            vObj.stock = (vObj.stock !== undefined ? vObj.stock : 0) + qty;
            if (vObj.stock > 0) vObj.isAvailable = true;

            if (itemSize && Array.isArray(vObj.sizes)) {
              const vsObj = vObj.sizes.find((s) => String(s.size).trim() === itemSize);
              if (vsObj) {
                vsObj.stock = (vsObj.stock !== undefined ? vsObj.stock : 0) + qty;
                if (vsObj.stock > 0) vsObj.isAvailable = true;
              }
            }
          }
          prodDoc.markModified('colorVariants');
        }

        await prodDoc.save();
      }
    }
  }
}

// ── POST /api/orders (Place COD or Direct Order) ──────────────────────────────
exports.placeOrder = async (req, res) => {
  try {
    const {
      customerId: rawCustomerId,
      customerEmail: rawEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      couponCode,
      shippingFee,
      paymentMethod,
    } = req.body;

    // Secure customer identity resolution from verified JWT session
    const customerEmail = (req.user?.email || rawEmail || '').toLowerCase().trim();
    const customerId = req.user?.userId || undefined;

    if (!customerEmail || !items?.length || !shippingAddress) {
      return res.status(400).json({ error: 'Missing required order fields: items, email, and shippingAddress are required.' });
    }

    const isCod = (paymentMethod || 'COD') === 'COD';

    // Recalculate and verify prices and stock from DB
    const {
      verifiedSubtotal,
      verifiedCouponDiscount,
      verifiedShippingFee,
      verifiedTotal,
      validatedItems,
    } = await calculateVerifiedOrderTotals({
      items,
      couponCode,
      shippingFee,
      isCod,
    });

    const orderNumber =
      'GRV-' + Date.now().toString().slice(-8) + '-' + Math.floor(100 + Math.random() * 900);

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const paymentStatus = isCod ? 'pending' : 'paid';

    const cleanPostalCode =
      (typeof shippingAddress.postalCode === 'string' && shippingAddress.postalCode.trim()) ||
      (shippingAddress.pinCode && String(shippingAddress.pinCode).trim()) ||
      (shippingAddress.pincode && String(shippingAddress.pincode).trim()) ||
      (typeof shippingAddress.street === 'string' && (shippingAddress.street.match(/\b\d{6}\b/) || [])[0]) ||
      '';

    const sanitizedAddress = {
      name: shippingAddress.name || customerName || 'Customer',
      phone: shippingAddress.phone || customerPhone || '',
      street: shippingAddress.street || shippingAddress.address || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      postalCode: cleanPostalCode,
      country: shippingAddress.country || 'India',
    };

    const order = await Order.create({
      orderNumber,
      customerId,
      customerEmail,
      customerName: customerName || sanitizedAddress.name,
      customerPhone: customerPhone || sanitizedAddress.phone,
      shippingAddress: sanitizedAddress,
      items: validatedItems,
      subtotal: verifiedSubtotal,
      discountAmount: verifiedCouponDiscount,
      couponCode: couponCode || '',
      shippingFee: verifiedShippingFee,
      totalAmount: verifiedTotal,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus,
      orderStatus: 'ordered',
      estimatedDelivery,
      statusHistory: [
        { status: 'ordered', timestamp: new Date(), note: `Order placed successfully via ${paymentMethod || 'COD'}` },
      ],
    });

    // Generate affiliate commission if customer belongs to an influencer
    try {
      await calculateAndRecordAffiliateCommission({
        order,
        customerId,
        customerEmail,
      });
    } catch (affErr) {
      console.warn('Backend affiliate commission error:', affErr);
    }

    // Update customer stats if authenticated
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalOrders: 1, totalSpent: verifiedTotal },
      }).catch(() => {});
      await Cart.deleteOne({ userId: customerId }).catch(() => {});
    } else if (customerEmail) {
      await Cart.deleteOne({ userId: { $regex: customerEmail } }).catch(() => {});
    }

    // Atomic product stock decrement
    await decrementOrderInventory(validatedItems).catch((stockErr) => {
      console.warn('Backend stock decrement warning:', stockErr);
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ error: err.message || 'Failed to place order' });
  }
};

// ── GET /api/orders (View Orders with Strict Ownership Verification) ──────────
exports.getOrders = async (req, res) => {
  try {
    let filter = {};

    if (req.admin) {
      // Admin can query any order or filter by query params
      const { email, customerId, status } = req.query;
      if (customerId) filter.customerId = customerId;
      if (email) filter.customerEmail = email.toLowerCase().trim();
      if (status) filter.orderStatus = status;
    } else if (req.user) {
      // Customer is strictly restricted to their own verified orders
      filter = {
        $or: [
          { customerId: req.user.userId },
          { customerEmail: req.user.email.toLowerCase().trim() },
        ],
      };
    } else {
      return res.status(401).json({ error: 'Authentication required to view orders' });
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/orders/:id (View Single Order with Security Check) ───────────────
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).lean();
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: orderId }).lean();
    }
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization & IDOR protection:
    if (req.admin) {
      // Admin has full access
      return res.json({ success: true, order });
    }

    if (req.user) {
      const isOwner =
        (order.customerId && order.customerId.toString() === req.user.userId) ||
        (order.customerEmail && order.customerEmail.toLowerCase().trim() === req.user.email.toLowerCase().trim());
      if (!isOwner) {
        return res.status(403).json({ error: 'You are not authorized to view this order.' });
      }
      return res.json({ success: true, order });
    }

    // Unauthenticated Guest tracking lookup: Must verify email or phone matching the order
    const queryEmail = req.query.email ? String(req.query.email).toLowerCase().trim() : '';
    const queryPhone = req.query.phone ? String(req.query.phone).replace(/\D/g, '').slice(-10) : '';

    const orderPhone = (order.customerPhone || '').replace(/\D/g, '').slice(-10);
    const orderEmail = (order.customerEmail || '').toLowerCase().trim();

    const isMatch = (queryEmail && queryEmail === orderEmail) || (queryPhone && queryPhone === orderPhone);

    if (isMatch) {
      return res.json({ success: true, order });
    }

    // If order was queried by exact order number, return masked view for tracking without leaking PII
    if (order.orderNumber === orderId) {
      const maskedOrder = {
        ...order,
        customerName: order.customerName ? order.customerName.charAt(0) + '***' : 'Customer',
        customerEmail: order.customerEmail ? order.customerEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '',
        customerPhone: order.customerPhone ? '******' + order.customerPhone.slice(-4) : '',
        shippingAddress: {
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || '',
          country: order.shippingAddress?.country || 'India',
        },
      };
      return res.json({ success: true, order: maskedOrder, masked: true });
    }

    return res.status(401).json({ error: 'Authentication or order verification required to view this order.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, returnReason, returnDescription, returnImages, location, estimatedDelivery } = req.body;
    const orderId = req.params.id;

    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: orderId });
    }
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization: if not admin, customer can only cancel or request return for their OWN order
    if (!req.admin) {
      const isOwner =
        req.user &&
        ((order.customerId && order.customerId.toString() === req.user.userId) ||
         (order.customerEmail && order.customerEmail.toLowerCase().trim() === req.user.email.toLowerCase().trim()));

      if (!isOwner) {
        return res.status(403).json({ error: 'You are not authorized to modify this order' });
      }

      if (status !== 'cancelled' && status !== 'return_requested') {
        return res.status(403).json({ error: 'Customers are only permitted to cancel or request returns.' });
      }
    }

    const cancellableStatuses = ['ordered', 'confirmed', 'processing'];
    const returnableStatuses  = ['delivered'];

    if (status === 'cancelled' && !cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }
    if (status === 'return_requested' && !returnableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Return can only be requested after delivery' });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    if (location !== undefined && location.trim()) {
      order.currentLocation = location.trim();
    }
    if (estimatedDelivery !== undefined && req.admin) {
      order.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : undefined;
    }

    // Restore inventory when order is cancelled
    if (status === 'cancelled' && previousStatus !== 'cancelled' && Array.isArray(order.items)) {
      await restoreOrderInventory(order.items).catch((restockErr) => {
        console.warn('Inventory restoration warning:', restockErr);
      });

      // Automated online refund if order was paid online via Razorpay
      const isOnlinePaid = order.paymentMethod !== 'COD' && order.paymentStatus === 'paid';
      const paymentId = order.razorpayPaymentId || order.paymentDetails?.razorpayPaymentId;
      if (isOnlinePaid && paymentId && order.paymentStatus !== 'refunded' && order.paymentStatus !== 'refund_initiated') {
        const refundResult = await requestRazorpayRefund({
          paymentId,
          amountInRupees: order.totalAmount,
          notes: {
            orderNumber: order.orderNumber,
            reason: note || 'Order cancelled before dispatch',
          },
        });
        if (refundResult.success) {
          order.paymentStatus = 'refund_initiated';
          if (!order.paymentDetails) order.paymentDetails = {};
          order.paymentDetails.refundId = refundResult.refundId;
          order.paymentDetails.refundStatus = refundResult.status || 'initiated';
          order.paymentDetails.refundAmount = order.totalAmount;
          order.paymentDetails.refundInitiatedAt = new Date();
          order.markModified('paymentDetails');
        }
      }
    }

    if (status === 'return_requested') {
      order.returnDetails = {
        reason: returnReason || 'Return requested by customer',
        description: returnDescription || '',
        images: Array.isArray(returnImages) ? returnImages : [],
        status: 'return_requested',
        requestedAt: new Date(),
      };
    } else if (order.returnDetails) {
      if (status === 'under_review') {
        order.returnDetails.status = 'under_review';
      } else if (status === 'return_approved' || status === 'approved') {
        order.returnDetails.status = 'approved';
        order.returnDetails.approvedAt = new Date();
      } else if (status === 'pickup_scheduled') {
        order.returnDetails.status = 'pickup_scheduled';
        order.returnDetails.pickupScheduledAt = new Date();
      } else if (status === 'return_received' || status === 'received') {
        order.returnDetails.status = 'received';
        order.returnDetails.receivedAt = new Date();
      } else if (status === 'refund_initiated') {
        order.returnDetails.status = 'refund_initiated';
        order.returnDetails.refundInitiatedAt = new Date();
      } else if (status === 'refunded') {
        order.returnDetails.status = 'refunded';
        order.returnDetails.refundedAt = new Date();
        order.paymentStatus = 'refunded';
      } else if (status === 'return_rejected' || status === 'rejected') {
        order.returnDetails.status = 'rejected';
        order.returnDetails.rejectedAt = new Date();
        order.returnDetails.rejectionReason = note || 'Return request rejected';
      }
    }

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      location: location ? location.trim() : (order.currentLocation || ''),
    });
    await order.save();

    try {
      await syncAffiliateCommissionOnOrderStatusChange(order._id, {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        reason: note,
      });
    } catch (affErr) {
      console.warn('Backend affiliate commission sync error:', affErr);
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/orders/razorpay/order ──────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { totalAmount, customerEmail: rawEmail, customerName, customerPhone, items, couponCode, shippingFee } = req.body;
    const customerEmail = (req.user?.email || rawEmail || '').toLowerCase().trim();

    let verifiedTotal = Number(totalAmount) || 0;

    // Server-side authoritative price and stock validation if items provided
    if (Array.isArray(items) && items.length > 0) {
      const calculated = await calculateVerifiedOrderTotals({
        items,
        couponCode,
        shippingFee,
        isCod: false,
      });
      verifiedTotal = calculated.verifiedTotal;
    }

    if (!verifiedTotal || verifiedTotal <= 0) {
      return res.status(400).json({ error: 'Valid positive totalAmount is required' });
    }

    const { keyId } = getRazorpayKeys();
    const razorpay = getRazorpayInstance();

    if (!razorpay || !keyId) {
      return res.status(500).json({
        error: 'Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET',
      });
    }

    const amountInPaise = Math.round(verifiedTotal * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({ error: 'Minimum online transaction amount is ₹1.00 (100 paise)' });
    }

    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        email: customerEmail || '',
        name: customerName || '',
        phone: customerPhone || '',
        userId: req.user?.userId || '',
      },
    });

    res.json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId,
      verifiedTotal,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create Razorpay order' });
  }
};

// ── POST /api/orders/razorpay/verify ─────────────────────────────────────────
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerEmail: rawEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      couponCode,
      shippingFee,
      totalAmount,
      paymentMethod,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification credentials: order_id, payment_id, and signature are required.' });
    }

    // 1. Timing-safe cryptographic HMAC-SHA256 signature verification
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Payment signature verification failed. Fraud attempt or invalid transaction.' });
    }

    // 2. Idempotency Check: Do not duplicate orders
    const existingOrder = await Order.findOne({
      $or: [
        { razorpayPaymentId: razorpay_payment_id },
        { razorpayOrderId: razorpay_order_id },
      ],
    });
    if (existingOrder) {
      return res.json({ success: true, order: existingOrder, message: 'Order already verified' });
    }

    // 3. Resolve customer identity from verified JWT session
    const customerEmail = (req.user?.email || rawEmail || '').toLowerCase().trim();
    const customerId = req.user?.userId || undefined;

    // 4. Fetch payment details from Razorpay SDK to verify status and amount
    let paymentDetails = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    };
    let resolvedMethod = paymentMethod || 'UPI';
    let paidAmountInRupees = Number(totalAmount) || 0;

    const razorpay = getRazorpayInstance();
    if (razorpay) {
      try {
        const paymentInfo = await razorpay.payments.fetch(razorpay_payment_id);
        if (paymentInfo) {
          if (paymentInfo.status !== 'captured' && paymentInfo.status !== 'authorized') {
            return res.status(400).json({ error: `Payment not completed. Status: ${paymentInfo.status}` });
          }
          paidAmountInRupees = Math.round(Number(paymentInfo.amount) / 100);
          paymentDetails = {
            ...paymentDetails,
            method: paymentInfo.method,
            bank: paymentInfo.bank,
            wallet: paymentInfo.wallet,
            vpa: paymentInfo.vpa,
            email: paymentInfo.email,
            contact: paymentInfo.contact,
            fee: paymentInfo.fee ? paymentInfo.fee / 100 : undefined,
            tax: paymentInfo.tax ? paymentInfo.tax / 100 : undefined,
            status: paymentInfo.status,
          };
          if (paymentInfo.method === 'upi') resolvedMethod = 'UPI';
          else if (paymentInfo.method === 'card') resolvedMethod = 'Card';
          else if (paymentInfo.method === 'netbanking') resolvedMethod = 'NetBanking';
          else if (paymentInfo.method === 'wallet') resolvedMethod = 'Wallet';
        }
      } catch (fetchErr) {
        console.warn('Could not fetch detailed payment from Razorpay:', fetchErr);
      }
    }

    // 5. Server-side price calculation
    let validatedItems = items || [];
    let verifiedSubtotal = 0;
    let verifiedCouponDiscount = 0;
    let verifiedShipping = Number(shippingFee) || 0;

    if (Array.isArray(items) && items.length > 0) {
      const calculated = await calculateVerifiedOrderTotals({
        items,
        couponCode,
        shippingFee,
        isCod: false,
      });
      validatedItems = calculated.validatedItems;
      verifiedSubtotal = calculated.verifiedSubtotal;
      verifiedCouponDiscount = calculated.verifiedCouponDiscount;
      verifiedShipping = calculated.verifiedShippingFee;
    }

    const orderNumber =
      'GRV-' + Date.now().toString().slice(-8) + '-' + Math.floor(100 + Math.random() * 900);
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const cleanPostalCode =
      (typeof shippingAddress?.postalCode === 'string' && shippingAddress.postalCode.trim()) ||
      (shippingAddress?.pinCode && String(shippingAddress.pinCode).trim()) ||
      (shippingAddress?.pincode && String(shippingAddress.pincode).trim()) ||
      (typeof shippingAddress?.street === 'string' && (shippingAddress.street.match(/\b\d{6}\b/) || [])[0]) ||
      '';

    const sanitizedAddress = {
      name: shippingAddress?.name || customerName || 'Customer',
      phone: shippingAddress?.phone || customerPhone || '',
      street: shippingAddress?.street || shippingAddress?.address || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      postalCode: cleanPostalCode,
      country: shippingAddress?.country || 'India',
    };

    const order = await Order.create({
      orderNumber,
      customerId,
      customerEmail,
      customerName: customerName || sanitizedAddress.name,
      customerPhone: customerPhone || sanitizedAddress.phone,
      shippingAddress: sanitizedAddress,
      items: validatedItems,
      subtotal: verifiedSubtotal || Number(req.body.subtotal) || paidAmountInRupees,
      discountAmount: verifiedCouponDiscount || Number(req.body.discountAmount) || 0,
      couponCode: couponCode || '',
      shippingFee: verifiedShipping,
      totalAmount: paidAmountInRupees,
      paymentMethod: resolvedMethod,
      paymentStatus: 'paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentDetails,
      orderStatus: 'ordered',
      estimatedDelivery,
      statusHistory: [
        {
          status: 'ordered',
          timestamp: new Date(),
          note: `Payment verified via Razorpay (${resolvedMethod}). Payment ID: ${razorpay_payment_id}`,
        },
      ],
    });

    // Generate affiliate commission if customer belongs to an influencer
    try {
      await calculateAndRecordAffiliateCommission({
        order,
        customerId,
        customerEmail,
      });
    } catch (affErr) {
      console.warn('Backend affiliate commission error (Razorpay):', affErr);
    }

    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalOrders: 1, totalSpent: paidAmountInRupees },
      }).catch(() => {});
      await Cart.deleteOne({ userId: customerId }).catch(() => {});
    } else if (customerEmail) {
      await Cart.deleteOne({ userId: { $regex: customerEmail } }).catch(() => {});
    }

    // Atomic stock decrement upon verified online payment
    await decrementOrderInventory(validatedItems).catch((e) => {
      console.warn('Stock decrement warning on payment verify:', e);
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Razorpay payment verification error:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
};

// ── POST /api/orders/razorpay/webhook ────────────────────────────────────────
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature header' });
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature({ rawBody, signature });

    if (!isValid) {
      console.error('❌ [Backend] Razorpay Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`🔔 [Backend] Razorpay Webhook event received: ${eventType}`);

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

    try {
      await syncAffiliateCommissionOnOrderStatusChange(order._id, {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        reason: note,
      });
    } catch (affErr) {
      console.warn('Backend affiliate commission sync error:', affErr);
    }
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

    try {
      await syncAffiliateCommissionOnOrderStatusChange(order._id, {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        reason: note,
      });
    } catch (affErr) {
      console.warn('Backend affiliate commission sync error:', affErr);
    }
        }
      }
    } else if (eventType === 'refund.processed') {
      const refundEntity = payload.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        const order = await Order.findOne({ razorpayPaymentId: paymentId });
        if (order) {
          order.paymentStatus = 'refunded';
          if (order.orderStatus === 'refund_initiated') {
            order.orderStatus = 'refunded';
          }
          if (order.returnDetails && order.returnDetails.status === 'refund_initiated') {
            order.returnDetails.status = 'refunded';
            order.returnDetails.refundedAt = new Date();
          }
          if (!order.paymentDetails) order.paymentDetails = {};
          order.paymentDetails.refundStatus = 'processed';
          order.paymentDetails.refundedAt = new Date();
          order.markModified('paymentDetails');

          order.statusHistory.push({
            status: order.orderStatus,
            timestamp: new Date(),
            note: `Refund of ₹${(refundEntity.amount / 100).toLocaleString('en-IN')} confirmed by Razorpay gateway (Refund ID: ${refundEntity.id}).`,
          });
          await order.save();

    try {
      await syncAffiliateCommissionOnOrderStatusChange(order._id, {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        reason: note,
      });
    } catch (affErr) {
      console.warn('Backend affiliate commission sync error:', affErr);
    }
        }
      }
    }

    res.json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
};
