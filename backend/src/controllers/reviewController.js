const Review  = require('../models/Review');
const Product = require('../models/Product');
const Order   = require('../models/Order');

// ── GET /api/reviews?productId=xxx ────────────────────────────────────────────
exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const reviews = await Review.find({ product: productId, status: 'approved' })
      .sort({ createdAt: -1 })
      .lean();

    const avgRating = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    res.json({ success: true, reviews, avgRating, count: reviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/reviews ─────────────────────────────────────────────────────────
exports.submitReview = async (req, res) => {
  try {
    const {
      productId, orderId, customerName, customerEmail,
      rating, comment, images, videos,
    } = req.body;

    if (!productId || !customerEmail || !rating) {
      return res.status(400).json({
        error: 'productId, customerEmail, and rating are required',
      });
    }

    // Only allow reviews on delivered orders
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order || order.orderStatus !== 'delivered') {
        return res.status(403).json({
          error: 'You can only review products from delivered orders',
        });
      }
    }

    // Prevent duplicate reviews
    const existing = await Review.findOne({ product: productId, customerEmail });
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product:            productId,
      orderId,
      customerName,
      customerEmail,
      rating:             Math.min(5, Math.max(1, Number(rating))),
      comment:            comment || '',
      images:             images  || [],
      videos:             videos  || [],
      isVerifiedPurchase: !!orderId,
      status:             'approved',
    });

    // Recalculate product average rating
    const allReviews = await Review.find({ product: productId, status: 'approved' });
    const avgRating  = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating:       Math.round(avgRating * 10) / 10,
      reviewsCount: allReviews.length,
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
