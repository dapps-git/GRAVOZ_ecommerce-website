const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    slot: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['home_banner', 'category_banner'], default: 'home_banner', index: true },
    imageUrl: { type: String, required: true },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    linkUrl: { type: String, default: '/products' },
    aspectRatio: { type: String, default: '16/9' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
