const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  imageUrl: { type: String, required: true },
  size: { type: String },
  color: { type: String },
  addedAt: { type: Date, default: Date.now },
});

const WishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    guestId: { type: String, index: true },
    items: [WishlistItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Wishlist || mongoose.model('Wishlist', WishlistSchema);
