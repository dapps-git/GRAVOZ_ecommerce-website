const Cart = require('../models/Cart');

// ── Helpers ──────────────────────────────────────────────────────────────────

const calcTotals = (items) => ({
  subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  count:    items.reduce((sum, i) => sum + i.quantity, 0),
});

// ── GET /api/cart ─────────────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const { guestId, userId } = req.query;
    const filter = userId ? { userId } : { guestId };
    if (!filter.userId && !filter.guestId) {
      return res.json({ success: true, items: [], subtotal: 0, count: 0 });
    }

    const cart  = await Cart.findOne(filter);
    const items = cart?.items || [];
    res.json({ success: true, items, ...calcTotals(items) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/cart ────────────────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
  try {
    const { guestId, userId, item } = req.body;
    if (!item?.productId || !item?.size) {
      return res.status(400).json({ error: 'Product ID and size are required' });
    }

    const filter = userId
      ? { userId }
      : { guestId: guestId || 'guest_' + Math.random().toString(36).substring(2, 10) };

    let cart = await Cart.findOne(filter);

    const cartItem = {
      productId:     item.productId,
      title:         item.title,
      price:         Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
      size:          item.size,
      quantity:      Number(item.quantity) || 1,
      imageUrl:      item.imageUrl || '/products/placeholder.svg',
      color:         item.color,
    };

    if (!cart) {
      cart = new Cart({ ...filter, items: [cartItem] });
    } else {
      const idx = cart.items.findIndex(
        (i) => i.productId === item.productId && i.size === item.size
      );
      if (idx > -1) {
        cart.items[idx].quantity += Number(item.quantity) || 1;
      } else {
        cart.items.push(cartItem);
      }
    }

    await cart.save();
    res.json({ success: true, items: cart.items, ...calcTotals(cart.items), guestId: cart.guestId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /api/cart ─────────────────────────────────────────────────────────────
exports.updateCart = async (req, res) => {
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

    res.json({ success: true, items: cart.items, ...calcTotals(cart.items) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /api/cart ──────────────────────────────────────────────────────────
exports.deleteFromCart = async (req, res) => {
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
    res.json({ success: true, items: cart.items, ...calcTotals(cart.items) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
