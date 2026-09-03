const Wishlist = require('../models/Wishlist');

// ── GET /api/wishlist ─────────────────────────────────────────────────────────
exports.getWishlist = async (req, res) => {
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
};

// ── POST /api/wishlist (toggle) ───────────────────────────────────────────────
exports.toggleWishlist = async (req, res) => {
  try {
    const { guestId, userId, item } = req.body;
    if (!item?.productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const filter = userId
      ? { userId }
      : { guestId: guestId || 'guest_' + Math.random().toString(36).substring(2, 10) };

    let wishlist = await Wishlist.findOne(filter);

    const wishItem = {
      productId:     item.productId,
      title:         item.title,
      price:         Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
      imageUrl:      item.imageUrl || '/products/placeholder.svg',
      size:          item.size,
      color:         item.color,
    };

    if (!wishlist) {
      wishlist = new Wishlist({ ...filter, items: [wishItem] });
    } else {
      const idx = wishlist.items.findIndex((i) => i.productId === item.productId);
      if (idx > -1) {
        wishlist.items.splice(idx, 1); // already in wishlist → remove (toggle)
      } else {
        wishlist.items.push(wishItem);
      }
    }

    await wishlist.save();
    res.json({
      success: true,
      items:   wishlist.items,
      count:   wishlist.items.length,
      guestId: wishlist.guestId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/wishlist ──────────────────────────────────────────────────────
exports.deleteFromWishlist = async (req, res) => {
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
};
