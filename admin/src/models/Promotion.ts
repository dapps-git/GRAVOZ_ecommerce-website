import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromotion extends Document {
  title: string;
  type: 'flash_sale' | 'bogo' | 'seasonal' | 'clearance';
  discountPercent: number;
  bannerImageUrl?: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'scheduled' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    title: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['flash_sale', 'bogo', 'seasonal', 'clearance'] },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    bannerImageUrl: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, default: 'active', enum: ['active', 'scheduled', 'expired'], index: true },
  },
  { timestamps: true }
);

const Promotion: Model<IPromotion> = mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);
export default Promotion;
