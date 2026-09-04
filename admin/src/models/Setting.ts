import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  currencySymbol: string;
  currencyCode: string;
  taxRatePercent: number;
  freeShippingThreshold: number;
  flatShippingRate: number;
  cloudinaryPreset?: string;
  bannerMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema<ISetting> = new Schema(
  {
    storeName: { type: String, default: 'GRAVOZ Shoes' },
    contactEmail: { type: String, default: 'support@gravoz.com' },
    contactPhone: { type: String, default: '+1 (800) 555-GRAV' },
    currencySymbol: { type: String, default: '₹' },
    currencyCode: { type: String, default: 'INR' },
    taxRatePercent: { type: Number, default: 5 },
    freeShippingThreshold: { type: Number, default: 100 },
    flatShippingRate: { type: Number, default: 15 },
    cloudinaryPreset: { type: String, default: 'gravoz_preset' },
    bannerMessage: { type: String, default: 'Welcome to GRAVOZ - Premium Shoes for Men, Women & Babies' },
  },
  { timestamps: true }
);

export const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
