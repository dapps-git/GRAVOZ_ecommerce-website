import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInfluencer extends Document {
  name: string;
  affiliateCode: string;
  email?: string;
  phone?: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InfluencerSchema = new Schema<IInfluencer>(
  {
    name: { type: String, required: true, trim: true, index: true },
    affiliateCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: { type: Number, default: 5, min: 0 },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Influencer: Model<IInfluencer> =
  mongoose.models.Influencer || mongoose.model<IInfluencer>('Influencer', InfluencerSchema);

export default Influencer;

