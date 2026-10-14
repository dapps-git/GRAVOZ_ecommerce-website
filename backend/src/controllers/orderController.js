const Order    = require('../models/Order');
const Customer = require('../models/Customer');
const Cart     = require('../models/Cart');
const Product  = require('../models/Product');
const Setting  = require('../models/Setting');
const mongoose = require('mongoose');

// ── POST /api/orders ──────────────────────────────────────────────────────────
exports.placeOrder = async (req, res) => {
  try {
    const {
      customerId, customerEmail, customerName, customerPhone,
      shippingAddress, items, subtotal, discountAmount, couponCode,
      shippingFee, totalAmount, paymentMethod,
    } = req.body;

    if (!customerEmail || !items?.length || !shippingAddress) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    // Verify all items are in stock
    for (const itm of items) {
      if (itm.productId && mongoose.Types.ObjectId.isValid(itm.productId)) {
        const prod = await Product.findById(itm.productId).lean();
        if (!prod || (prod.stock !== undefined && prod.stock <= 0)) {
          return res.status(400).json({
            error: `Item "${itm.name || prod?.name || 'Product'}" is currently out of stock. Please remove it from your cart.`,
          });
        }
      }
    }

    const orderNumber =
      'GRV-' + Date.now().toString().slice(-8) + '-' + Math.floor(100 + Math.random() * 900);

    // Estimated delivery: 5 business days from now
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const paymentStatus = paymentMethod === 'COD' ? 'pending' : 'paid';

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
      items,
      subtotal,
      discountAmount:  discountAmount || 0,
      couponCode:      couponCode || '',
      shippingFee:     shippingFee || 0,
      totalAmount,
      paymentMethod:   paymentMethod || 'COD',
      paymentStatus,
      orderStatus: 'ordered',
      estimatedDelivery,
      statusHistory: [
        { status: 'ordered', timestamp: new Date(), note: 'Order placed successfully' },
      ],
    });

    // Update customer lifetime stats
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalOrders: 1, totalSpent: totalAmount },
      });
    }

    // Clear cart after successful order
    if (customerId) {
      await Cart.deleteOne({ userId: customerId });
    } else if (customerEmail) {
      await Cart.deleteOne({ userId: { $regex: customerEmail } });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/orders?email=xxx&customerId=xxx ──────────────────────────────────
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
      // Customer is strictly restricted to their own orders
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

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // If authenticated user is not an admin, verify ownership
    if (req.user && !req.admin) {
      const isOwner =
        (order.customerId && order.customerId.toString() === req.user.userId) ||
        (order.customerEmail && order.customerEmail.toLowerCase().trim() === req.user.email.toLowerCase().trim());
      if (!isOwner) {
        return res.status(403).json({ error: 'You are not authorized to view this order.' });
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, returnReason, returnDescription, returnImages, location, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);
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

    order.orderStatus = status;
    if (location !== undefined && location.trim()) {
      order.currentLocation = location.trim();
    }
    if (estimatedDelivery !== undefined && req.admin) {
      order.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : undefined;
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
      note: note || '',
      location: location ? location.trim() : (order.currentLocation || ''),
    });
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/orders/razorpay/order ──────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { getRazorpayInstance, getRazorpayKeys } = require('../utils/razorpay');
    const { totalAmount, customerEmail, customerName, customerPhone, items } = req.body;

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid totalAmount is required' });
    }

    const { keyId } = getRazorpayKeys();
    const razorpay = getRazorpayInstance();

    if (!razorpay || !keyId) {
      return res.status(500).json({
        error: 'Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET',
      });
    }

    const amountInPaise = Math.round(Number(totalAmount) * 100);
    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        email: customerEmail || '',
        name: customerName || '',
        phone: customerPhone || '',
      },
    });

    res.json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create Razorpay order' });
  }
};

// ── POST /api/orders/razorpay/verify ─────────────────────────────────────────
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { verifyRazorpaySignature, getRazorpayInstance } = require('../utils/razorpay');
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      discountAmount,
      couponCode,
      shippingFee,
      totalAmount,
      paymentMethod,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification credentials' });
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    const existingOrder = await Order.findOne({
      $or: [
        { razorpayPaymentId: razorpay_payment_id },
        { razorpayOrderId: razorpay_order_id },
      ],
    });
    if (existingOrder) {
      return res.json({ success: true, order: existingOrder });
    }

    const orderNumber =
      'GRV-' + Date.now().toString().slice(-8) + '-' + Math.floor(100 + Math.random() * 900);
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

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

    let paymentDetails = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    };
    let resolvedMethod = paymentMethod || 'UPI';

    const razorpay = getRazorpayInstance();
    if (razorpay) {
      try {
        const paymentInfo = await razorpay.payments.fetch(razorpay_payment_id);
        if (paymentInfo) {
          paymentDetails = {
            ...paymentDetails,
            method: paymentInfo.method,
            bank: paymentInfo.bank,
            wallet: paymentInfo.wallet,
            vpa: paymentInfo.vpa,
            email: paymentInfo.email,
            contact: paymentInfo.contact,
          };
          if (paymentInfo.method === 'upi') resolvedMethod = 'UPI';
          else if (paymentInfo.method === 'card') resolvedMethod = 'Card';
          else if (paymentInfo.method === 'netbanking') resolvedMethod = 'NetBanking';
          else if (paymentInfo.method === 'wallet') resolvedMethod = 'Wallet';
        }
      } catch (e) {}
    }

    const order = await Order.create({
      orderNumber,
      customerId,
      customerEmail,
      customerName: customerName || sanitizedAddress.name,
      customerPhone: customerPhone || sanitizedAddress.phone,
      shippingAddress: sanitizedAddress,
      items,
      subtotal,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || '',
      shippingFee: shippingFee || 0,
      totalAmount,
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

    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalOrders: 1, totalSpent: totalAmount },
      });
      await Cart.deleteOne({ userId: customerId });
    } else if (customerEmail) {
      await Cart.deleteOne({ userId: { $regex: customerEmail } });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Razorpay payment verification error:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
};

