import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReferral extends Document {
  referrer: mongoose.Types.ObjectId;
  referredUser: mongoose.Types.ObjectId;
  referralCode: string;
  status: 'pending' | 'completed' | 'cancelled';
  referredDiscountPercent: number;
  referredDiscountUsed: boolean;
  referredOrderId?: mongoose.Types.ObjectId;
  referrerDiscountAmount: number;
  referrerDiscountAvailable: boolean;
  referrerDiscountUsed: boolean;
  referrerOrderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    referredUser: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      unique: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    referredDiscountPercent: {
      type: Number,
      default: 15,
    },
    referredDiscountUsed: {
      type: Boolean,
      default: false,
    },
    referredOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    referrerDiscountAmount: {
      type: Number,
      default: 100,
    },
    referrerDiscountAvailable: {
      type: Boolean,
      default: false,
    },
    referrerDiscountUsed: {
      type: Boolean,
      default: false,
    },
    referrerOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  { timestamps: true }
);

export const Referral: Model<IReferral> =
  mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);

export default Referral;
