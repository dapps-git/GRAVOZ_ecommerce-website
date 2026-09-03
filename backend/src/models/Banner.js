const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    slot: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['home_banner', 'category_banner', 'duo_showcase'],
      default: 'home_banner',
      index: true,
    },
    imageUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    lifestyleUrl: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    productId: { type: String, default: '' },
    linkUrl: { type: String, default: '/products' },
    sizes: { type: [String], default: ['5', '6', '7', '8', '9', '10'] },
    colors: {
      type: [
        {
          name: { type: String, default: '' },
          colorCode: { type: String, default: '#000000' },
          imageUrl: { type: String, default: '' },
        },
      ],
      default: [],
    },
    aspectRatio: { type: String, default: '16/9' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Banner) {
  delete mongoose.models.Banner;
}

module.exports = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
