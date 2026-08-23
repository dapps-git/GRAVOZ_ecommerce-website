import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  usageLimitPerCustomer: number;
  totalUsageLimit: number;
  usedCount: number;
  startDate: Date;
  expiryDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, required: true, enum: ['percentage', 'fixed_amount', 'free_shipping'] },
    value: { type: Number, required: true, min: 0 },
    minPurchaseAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    usageLimitPerCustomer: { type: Number, default: 1 },
    totalUsageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
export default Coupon;
