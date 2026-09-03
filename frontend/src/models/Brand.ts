import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrandSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  slug?: string;
}

export interface IBrand extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  status: 'active' | 'inactive';
  seo?: IBrandSEO;
  totalProducts: number;
  totalSales: number;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSEOSchema = new Schema<IBrandSEO>({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  keywords: [{ type: String }],
  slug: { type: String, default: '' },
});

const BrandSchema = new Schema<IBrand>(
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

export const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);

export default Brand;
