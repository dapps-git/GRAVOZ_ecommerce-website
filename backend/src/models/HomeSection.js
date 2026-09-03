const mongoose = require('mongoose');

const HomeSectionItemSchema = new mongoose.Schema({
  id: { type: String, default: () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` },

  // ─── Basic card info ──────────────────────────────────────────────────────
  title:         { type: String, required: true },
  description:   { type: String, default: '' },        // Short product description blurb
  price:         { type: Number, required: true, default: 1399 },
  originalPrice: { type: Number },                     // For strikethrough

  // ─── Images ───────────────────────────────────────────────────────────────
  imageUrl:      { type: String, required: true },     // Main lifestyle / hero photo on card
  insetImageUrl: { type: String },                     // Optional small floating thumbnail (bottom-left)

  // ─── Sizing ───────────────────────────────────────────────────────────────
  // mirrors the sizeAvailability field in Product model
  sizes: [
    {
      size:        { type: String, required: true },
      isAvailable: { type: Boolean, default: true },
    },
  ],

  // ─── Colors ───────────────────────────────────────────────────────────────
  // lightweight: just name + colorCode (hex) — no per-variant images needed here
  colors: [
    {
      name:      { type: String, required: true },
      colorCode: { type: String, default: '#000000' },
    },
  ],

  // ─── Navigation ───────────────────────────────────────────────────────────
  linkUrl:      { type: String, default: '/products' },
  productId:    { type: String },  // MongoDB Product._id for auto cart actions
  isAvailable:  { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

const HomeSectionSchema = new mongoose.Schema(
  {
    sectionKey: {
      type: String,
      required: true,
      unique: true,
      enum: ['best_sellers', 'top_selling', 'latest_products', 'featured_products'],
    },
    title:        { type: String, required: true },
    subtitle:     { type: String },
    isActive:     { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    items:        [HomeSectionItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.HomeSection || mongoose.model('HomeSection', HomeSectionSchema);
