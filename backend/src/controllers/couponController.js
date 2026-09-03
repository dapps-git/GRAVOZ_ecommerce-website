const Coupon = require('../models/Coupon');

// ── POST /api/coupons/validate ────────────────────────────────────────────────
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const coupon = await Coupon.findOne({
      code:       code.toUpperCase().trim(),
      isActive:   true,
      expiryDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    if (coupon.usedCount >= coupon.totalUsageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit has been reached' });
    }

    if (cartTotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        error: `Minimum purchase of ₹${coupon.minPurchaseAmount} required for this coupon`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((cartTotal * coupon.value) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.type === 'fixed_amount') {
      discountAmount = Math.min(coupon.value, cartTotal);
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
