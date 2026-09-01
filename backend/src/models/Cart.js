const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  imageUrl: { type: String, required: true },
  color: { type: String },
});

const CartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    guestId: { type: String, index: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
