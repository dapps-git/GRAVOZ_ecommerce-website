const mongoose = require('mongoose');

const ProductImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, required: true, default: 'Shoe image' },
  publicId: { type: String },
});

const ProductSEOSchema = new mongoose.Schema({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  keywords: [{ type: String }],
  slug: { type: String, default: '' },
  ogTitle: { type: String, default: '' },
  ogDescription: { type: String, default: '' },
  ogImage: { type: String, default: '' },
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true },
    targetAudience: { type: String, required: true, enum: ['Men', 'Women', 'Babies'], index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', index: true },
    subCategory: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    features: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    gst: { type: Number, default: 12, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0, index: true },
    sizes: [{ type: String }],
    sizeAvailability: [
      {
        size: { type: String, required: true },
        isAvailable: { type: Boolean, default: true },
        stock: { type: Number, default: 10 },
      },
    ],
    colors: [{ type: String }],
    colorVariants: [
      {
        id: { type: String, default: '' },
        name: { type: String, required: true },
        colorCode: { type: String, default: '#000000' },
        imageUrl: { type: String, default: '' },
        images: { type: [ProductImageSchema], default: [] },
        sizes: [
          {
            size: { type: String, required: true },
            isAvailable: { type: Boolean, default: true },
            stock: { type: Number, default: 10 },
          },
        ],
        isAvailable: { type: Boolean, default: true },
      },
    ],
    images: {
      type: [ProductImageSchema],
      validate: [
        function (val) {
          return val.length >= 1;
        },
        'Product must have at least 1 photo',
      ],
    },
    // Product Specifications
    material: { type: String, default: '' },
    ageRange: { type: String, default: '' },
    occasion: { type: String, default: '' },
    strapType: { type: String, default: '' },
    closureType: { type: String, default: '' },
    shoeType: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    hsnCode: { type: String, default: '' },
    packingLength: { type: Number, default: 0 },
    packingWidth: { type: Number, default: 0 },
    packingHeight: { type: Number, default: 0 },
    seo: { type: ProductSEOSchema, default: () => ({}) },
    isBestSeller: { type: Boolean, default: false, index: true },
    isTopSeller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isLatest: { type: Boolean, default: false, index: true },
    badge: { type: String, default: '' },
    status: { type: String, default: 'active', enum: ['active', 'draft', 'archived'] },
  },
  { timestamps: true }
);

ProductSchema.index({ targetAudience: 1, isBestSeller: 1 });
ProductSchema.index({ name: 'text', description: 'text', subCategory: 'text' });

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
