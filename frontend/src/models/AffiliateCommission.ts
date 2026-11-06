import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliateCommission extends Document {
  influencerId: mongoose.Types.ObjectId;
  influencerName: string;
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  customerId?: mongoose.Types.ObjectId | string;
  customerName: string;
  customerEmail: string;
  orderSubtotal: number;
  orderTotal: number;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paidAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateCommissionSchema = new Schema<IAffiliateCommission>(
  {
    influencerId: {
      type: Schema.Types.ObjectId,
      ref: 'Influencer',
      required: true,
      index: true,
    },
    influencerName: { type: String, default: '' },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.Mixed, default: null, index: true },
    customerName: { type: String, default: 'Customer' },
    customerEmail: { type: String, default: '', lowercase: true, trim: true, index: true },
    orderSubtotal: { type: Number, required: true, min: 0 },
    orderTotal: { type: Number, required: true, min: 0 },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionRate: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const AffiliateCommission: Model<IAffiliateCommission> =
  mongoose.models.AffiliateCommission ||
  mongoose.model<IAffiliateCommission>('AffiliateCommission', AffiliateCommissionSchema);

export default AffiliateCommission;

