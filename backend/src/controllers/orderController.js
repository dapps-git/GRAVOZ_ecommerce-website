const Order    = require('../models/Order');
const Customer = require('../models/Customer');
const Cart     = require('../models/Cart');

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
      '600040';

    const sanitizedAddress = {
      name: shippingAddress.name || customerName || 'Customer',
      phone: shippingAddress.phone || customerPhone || '',
      street: shippingAddress.street || shippingAddress.address || 'Street Address',
      city: shippingAddress.city || 'Chennai',
      state: shippingAddress.state || 'Tamil Nadu',
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
    const { email, customerId } = req.query;
    if (!email && !customerId) {
      return res.status(400).json({ error: 'email or customerId required' });
    }

    const filter = customerId
      ? { customerId }
      : { customerEmail: email.toLowerCase() };

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
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, returnReason, returnDescription, returnImages } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const cancellableStatuses = ['ordered', 'confirmed', 'processing'];
    const returnableStatuses  = ['delivered'];

    if (status === 'cancelled' && !cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }
    if (status === 'return_requested' && !returnableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Return can only be requested after delivery' });
    }

    order.orderStatus = status;

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
    order.statusHistory.push({ status, timestamp: new Date(), note: note || '' });
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
