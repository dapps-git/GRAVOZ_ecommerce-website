import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBanner extends Document {
  slot: string; // 'hero' | 'secondary' | 'comfort_sandal' | 'promo_strip' | 'daily_collection' | 'category_women' | 'category_men' | 'category_kids'
  name: string;
  category: 'home_banner' | 'category_banner';
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  aspectRatio?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
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

export const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;
