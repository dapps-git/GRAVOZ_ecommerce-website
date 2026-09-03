import mongoose, { Schema, Document, Model } from 'mongoose';

export interface HomeSectionColor {
  name: string;
  colorCode: string;
}

export interface HomeSectionSize {
  size: string;
  isAvailable: boolean;
}

export interface IHomeSectionItem {
  id?: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  insetImageUrl?: string;
  sizes?: HomeSectionSize[];
  colors?: HomeSectionColor[];
  linkUrl?: string;
  productId?: string;
  isAvailable?: boolean;
  displayOrder?: number;
}

export interface IHomeSection extends Document {
  sectionKey: 'best_sellers' | 'top_selling' | 'latest_products' | 'featured_products';
  title: string;
  subtitle?: string;
  isActive: boolean;
  displayOrder: number;
  items: IHomeSectionItem[];
  createdAt: Date;
  updatedAt: Date;
}

const HomeSectionItemSchema = new Schema<IHomeSectionItem>({
  id: { type: String, default: () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` },
  title:         { type: String, required: true },
  description:   { type: String, default: '' },
  price:         { type: Number, required: true, default: 1399 },
  originalPrice: { type: Number },
  imageUrl:      { type: String, required: true },
  insetImageUrl: { type: String },
  sizes: [
    {
      size:        { type: String, required: true },
      isAvailable: { type: Boolean, default: true },
    },
  ],
  colors: [
    {
      name:      { type: String, required: true },
      colorCode: { type: String, default: '#000000' },
    },
  ],
  linkUrl:      { type: String, default: '/products' },
  productId:    { type: String },
  isAvailable:  { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

const HomeSectionSchema = new Schema<IHomeSection>(
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

export const HomeSection: Model<IHomeSection> =
  mongoose.models.HomeSection || mongoose.model<IHomeSection>('HomeSection', HomeSectionSchema);
