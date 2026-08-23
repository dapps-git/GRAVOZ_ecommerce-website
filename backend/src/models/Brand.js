const mongoose = require('mongoose');

const BrandSEOSchema = new mongoose.Schema({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  keywords: [{ type: String }],
  slug: { type: String, default: '' },
});

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    logoUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    status: { type: String, default: 'active', enum: ['active', 'inactive'], index: true },
    seo: { type: BrandSEOSchema, default: () => ({}) },
    totalProducts: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);
