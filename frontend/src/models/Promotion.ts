import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromotion extends Document {
  title: string;
  subtitle?: string;
  type: 'hero' | 'secondary' | 'flash_sale' | 'bogo' | 'seasonal' | 'clearance';
  discountPercent?: number;
  bannerImageUrl: string;
  linkUrl?: string;
  displayOrder?: number;
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'scheduled' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    title: { type: String, required: true, index: true },
    subtitle: { type: String, default: '' },
    type: { type: String, required: true, enum: ['hero', 'secondary', 'flash_sale', 'bogo', 'seasonal', 'clearance'], default: 'hero' },
    discountPercent: { type: Number, min: 0, max: 100 },
    bannerImageUrl: { type: String, required: true },
    linkUrl: { type: String, default: '/' },
    displayOrder: { type: Number, default: 1 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, default: 'active', enum: ['active', 'scheduled', 'expired'], index: true },
  },
  { timestamps: true }
);

const Promotion: Model<IPromotion> = mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);

export { Promotion };
export default Promotion;
