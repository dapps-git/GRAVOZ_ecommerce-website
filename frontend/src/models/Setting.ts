import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
  storeName: string;
  storeTagline: string;
  contactEmail: string;
  contactPhone: string;
  gstinTaxId: string;
  currencySymbol: string;
  currencyCode: string;
  taxRatePercent: number;
  freeShippingThreshold: number;
  codDeliveryCharge: number;
  flatShippingRate: number;
  referralRewardCredit: number;
  friendFirstOrderDiscountPercent: number;
  cloudinaryPreset?: string;
  bannerMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema<ISetting> = new Schema(
  {
    storeName: { type: String, default: 'GRAVOZ Footwear' },
    storeTagline: { type: String, default: 'Premium Handcrafted Footwear & Leather Collections' },
    contactEmail: { type: String, default: 'support@gravoz.com' },
    contactPhone: { type: String, default: '+91 98765 43210' },
    gstinTaxId: { type: String, default: '32AAACL1902K1Z8' },
    currencySymbol: { type: String, default: '₹' },
    currencyCode: { type: String, default: 'INR' },
    taxRatePercent: { type: Number, default: 5 },
    freeShippingThreshold: { type: Number, default: 999 },
    codDeliveryCharge: { type: Number, default: 25 },
    flatShippingRate: { type: Number, default: 0 },
    referralRewardCredit: { type: Number, default: 100 },
    friendFirstOrderDiscountPercent: { type: Number, default: 15 },
    cloudinaryPreset: { type: String, default: 'gravoz_preset' },
    bannerMessage: { type: String, default: 'Welcome to GRAVOZ - Handcrafted Footwear for Men, Women & Babies' },
  },
  { timestamps: true }
);

export const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
