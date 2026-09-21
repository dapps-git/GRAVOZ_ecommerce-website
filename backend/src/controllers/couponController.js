const Coupon = require('../models/Coupon');
const Customer = require('../models/Customer');

// ── POST /api/coupons/validate ────────────────────────────────────────────────
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, email, customerId } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const cleanCode = code.toUpperCase().trim();
    const total = Number(cartTotal) || 0;

    // Special Welcome Coupon: FIRSTSTEP
    if (cleanCode === 'FIRSTSTEP') {
      if (customerId || email) {
        const query = customerId ? { _id: customerId } : { email: email.toLowerCase().trim() };
        const cust = await Customer.findOne(query);
        if (cust) {
          if (cust.referredBy || cust.referralCodeUsed) {
            return res.status(400).json({
              error: 'Referral accounts receive a 15% first-order discount and are not eligible for the FIRSTSTEP welcome coupon.',
            });
          }
          if ((cust.totalOrders || 0) > 0) {
            return res.status(400).json({
              error: 'The FIRSTSTEP welcome coupon is only valid on your first order.',
            });
          }
        }
      }

      const coupon = await Coupon.findOne({ code: 'FIRSTSTEP', isActive: true });
      const val = coupon ? coupon.value : 250;
      const minPurchase = coupon ? coupon.minPurchaseAmount : 0;

      if (total < minPurchase) {
        return res.status(400).json({
          error: `Minimum purchase of ₹${minPurchase} required for FIRSTSTEP`,
        });
      }

      return res.json({
        success: true,
        discountAmount: Math.min(val, total),
        coupon: {
          code: 'FIRSTSTEP',
          type: 'fixed_amount',
          value: val,
          description: `₹${val} OFF Welcome Offer`,
        },
      });
    }

    if (cleanCode === 'STYLE20') {
      const discountAmount = Math.round(total * 0.2);
      return res.json({
        success: true,
        discountAmount,
        coupon: {
          code: 'STYLE20',
          type: 'percentage',
          value: 20,
          description: '20% off on all footwear',
        },
      });
    }

    const coupon = await Coupon.findOne({
      code:       cleanCode,
      isActive:   true,
      expiryDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    if (coupon.usedCount >= coupon.totalUsageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit has been reached' });
    }

    if (total < coupon.minPurchaseAmount) {
      return res.status(400).json({
        error: `Minimum purchase of ₹${coupon.minPurchaseAmount} required for this coupon`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((total * coupon.value) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.type === 'fixed_amount') {
      discountAmount = Math.min(coupon.value, total);
    }

    res.json({
      success: true,
      discountAmount,
      coupon: {
        code:        coupon.code,
        type:        coupon.type,
        value:       coupon.value,
        description: coupon.type === 'percentage'
          ? `${coupon.value}% off`
          : `₹${coupon.value} off`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
