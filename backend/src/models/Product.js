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
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0, index: true },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    images: {
      type: [ProductImageSchema],
      validate: [
        function (val) {
          return val.length >= 1 && val.length <= 3;
        },
        'Product must have between 1 and 3 photos',
      ],
    },
    seo: { type: ProductSEOSchema, default: () => ({}) },
    isBestSeller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    status: { type: String, default: 'active', enum: ['active', 'draft', 'archived'] },
  },
  { timestamps: true }
);

ProductSchema.index({ targetAudience: 1, isBestSeller: 1 });
ProductSchema.index({ name: 'text', description: 'text', subCategory: 'text' });

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
