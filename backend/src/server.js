const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gravoz';

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Models
const Cart = require('./models/Cart');
const Wishlist = require('./models/Wishlist');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB database (gravoz)'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── CART ROUTES ──
// GET /api/cart?guestId=...
app.get('/api/cart', async (req, res) => {
  try {
    const { guestId, userId } = req.query;
    const filter = userId ? { userId } : { guestId };
    if (!filter.userId && !filter.guestId) {
      return res.json({ success: true, items: [], subtotal: 0, count: 0 });
    }

    const cart = await Cart.findOne(filter);
    const items = cart?.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ success: true, items, subtotal, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart (Add item)
app.post('/api/cart', async (req, res) => {
  try {
    const { guestId, userId, item } = req.body;
    if (!item?.productId || !item?.size) {
      return res.status(400).json({ error: 'Product ID and size are required' });
    }

    const filter = userId ? { userId } : { guestId: guestId || 'guest_' + Math.random().toString(36).substring(2, 10) };
    let cart = await Cart.findOne(filter);

    if (!cart) {
      cart = new Cart({
        ...filter,
        items: [
          {
            productId: item.productId,
            title: item.title,
            price: Number(item.price),
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            size: item.size,
            quantity: Number(item.quantity) || 1,
            imageUrl: item.imageUrl || '/products/product1.webp',
            color: item.color,
          },
        ],
      });
    } else {
      const idx = cart.items.findIndex(
        (i) => i.productId === item.productId && i.size === item.size
      );

      if (idx > -1) {
        cart.items[idx].quantity += Number(item.quantity) || 1;
      } else {
        cart.items.push({
          productId: item.productId,
          title: item.title,
          price: Number(item.price),
          originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
          size: item.size,
          quantity: Number(item.quantity) || 1,
          imageUrl: item.imageUrl || '/products/product1.webp',
          color: item.color,
        });
      }
    }

    await cart.save();
    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    res.json({ success: true, items: cart.items, subtotal, count, guestId: cart.guestId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart (Update quantity)
app.put('/api/cart', async (req, res) => {
  try {
    const { guestId, userId, productId, size, quantity } = req.body;
    const filter = userId ? { userId } : { guestId };

    const cart = await Cart.findOne(filter);
    if (!cart) return res.json({ success: true, items: [], subtotal: 0, count: 0 });

    const idx = cart.items.findIndex((i) => i.productId === productId && i.size === size);
    if (idx > -1) {
      if (quantity <= 0) {
        cart.items.splice(idx, 1);
      } else {
        cart.items[idx].quantity = quantity;
      }
      await cart.save();
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    res.json({ success: true, items: cart.items, subtotal, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart
app.delete('/api/cart', async (req, res) => {
  try {
    const { guestId, userId, productId, size, clearAll } = req.query;
    const filter = userId ? { userId } : { guestId };

    const cart = await Cart.findOne(filter);
    if (!cart) return res.json({ success: true, items: [], subtotal: 0, count: 0 });

    if (clearAll === 'true') {
      cart.items = [];
    } else if (productId && size) {
      cart.items = cart.items.filter(
        (i) => !(i.productId === productId && i.size === size)
      );
    }

    await cart.save();
    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    res.json({ success: true, items: cart.items, subtotal, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── WISHLIST ROUTES ──
// GET /api/wishlist
app.get('/api/wishlist', async (req, res) => {
  try {
    const { guestId, userId } = req.query;
    const filter = userId ? { userId } : { guestId };
    if (!filter.userId && !filter.guestId) {
      return res.json({ success: true, items: [], count: 0 });
    }

    const wishlist = await Wishlist.findOne(filter);
    const items = wishlist?.items || [];
    res.json({ success: true, items, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wishlist (Toggle item)
app.post('/api/wishlist', async (req, res) => {
  try {
    const { guestId, userId, item } = req.body;
    if (!item?.productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const filter = userId ? { userId } : { guestId: guestId || 'guest_' + Math.random().toString(36).substring(2, 10) };
    let wishlist = await Wishlist.findOne(filter);

    if (!wishlist) {
      wishlist = new Wishlist({
        ...filter,
        items: [
          {
            productId: item.productId,
            title: item.title,
            price: Number(item.price),
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            imageUrl: item.imageUrl || '/products/product1.webp',
            size: item.size,
            color: item.color,
          },
        ],
      });
    } else {
      const idx = wishlist.items.findIndex((i) => i.productId === item.productId);
      if (idx > -1) {
        wishlist.items.splice(idx, 1);
      } else {
        wishlist.items.push({
          productId: item.productId,
          title: item.title,
          price: Number(item.price),
          originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
          imageUrl: item.imageUrl || '/products/product1.webp',
          size: item.size,
          color: item.color,
        });
      }
    }

    await wishlist.save();
    res.json({ success: true, items: wishlist.items, count: wishlist.items.length, guestId: wishlist.guestId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/wishlist
app.delete('/api/wishlist', async (req, res) => {
  try {
    const { guestId, userId, productId, clearAll } = req.query;
    const filter = userId ? { userId } : { guestId };

    const wishlist = await Wishlist.findOne(filter);
    if (!wishlist) return res.json({ success: true, items: [], count: 0 });

    if (clearAll === 'true') {
      wishlist.items = [];
    } else if (productId) {
      wishlist.items = wishlist.items.filter((i) => i.productId !== productId);
    }

    await wishlist.save();
    res.json({ success: true, items: wishlist.items, count: wishlist.items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── ORDER ROUTES ──

// POST /api/orders (Place an order)
app.post('/api/orders', async (req, res) => {
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

    // Estimated delivery: 5 days from now
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const paymentStatus = paymentMethod === 'COD' ? 'pending' : 'paid';

    const order = await Order.create({
      orderNumber,
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || '',
      shippingFee: shippingFee || 0,
      totalAmount,
      paymentMethod,
      paymentStatus,
      orderStatus: 'ordered',
      estimatedDelivery,
      statusHistory: [{ status: 'ordered', timestamp: new Date(), note: 'Order placed successfully' }],
    });

    // Update customer stats
    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalOrders: 1, totalSpent: totalAmount },
      });
    }

    // Clear cart for this user
    if (customerId) {
      await require('./models/Cart').deleteOne({ userId: customerId });
    } else if (customerEmail) {
      await require('./models/Cart').deleteOne({ userId: { $regex: customerEmail } });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders?email=xxx
app.get('/api/orders', async (req, res) => {
  try {
    const { email, customerId } = req.query;
    if (!email && !customerId) {
      return res.status(400).json({ error: 'email or customerId required' });
    }

    const filter = customerId ? { customerId } : { customerEmail: email.toLowerCase() };
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status (Admin or customer cancel)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const cancellableStatuses = ['ordered', 'confirmed', 'processing'];
    const returnableStatuses = ['delivered'];

    if (status === 'cancelled' && !cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }
    if (status === 'return_requested' && !returnableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Return can only be requested after delivery' });
    }

    order.orderStatus = status;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({ status, timestamp: new Date(), note: note || '' });
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── COUPON ROUTES ──

// POST /api/coupons/validate
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
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
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: `${coupon.type === 'percentage' ? coupon.value + '% off' : '₹' + coupon.value + ' off'}`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REVIEW ROUTES (frontend-facing) ──

// GET /api/reviews?productId=xxx
app.get('/api/reviews', async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const Review = require('./models/Review');
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
});

// POST /api/reviews (Submit a review)
app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, orderId, customerName, customerEmail, rating, comment, images, videos } = req.body;

    if (!productId || !customerEmail || !rating) {
      return res.status(400).json({ error: 'productId, customerEmail, and rating are required' });
    }

    // Verify customer placed this order and it was delivered
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order || order.orderStatus !== 'delivered') {
        return res.status(403).json({ error: 'You can only review products from delivered orders' });
      }
    }

    // Prevent duplicate reviews from same customer for same product
    const Review = require('./models/Review');
    const existing = await Review.findOne({ product: productId, customerEmail });
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      orderId,
      customerName,
      customerEmail,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment || '',
      images: images || [],
      videos: videos || [],
      isVerifiedPurchase: !!orderId,
      status: 'approved',
    });

    // Update product average rating
    const allReviews = await Review.find({ product: productId, status: 'approved' });
    const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewsCount: allReviews.length,
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`GRAVOZ Express Backend server listening on port ${PORT}`);
});
