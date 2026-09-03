import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReturnRefund extends Document {
  order: mongoose.Types.ObjectId;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  reason: string;
  description?: string;
  images?: string[];
  refundAmount: number;
  status:
    | 'return_requested'
    | 'under_review'
    | 'approved'
    | 'pickup_scheduled'
    | 'received'
    | 'refund_initiated'
    | 'refunded'
    | 'rejected'
    | 'requested'
    | 'processed';
  adminNotes?: string;
  approvedAt?: Date;
  pickupScheduledAt?: Date;
  receivedAt?: Date;
  refundInitiatedAt?: Date;
  refundedAt?: Date;
  rejectedAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnRefundSchema: Schema<IReturnRefund> = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, index: true },
    customerPhone: { type: String, default: '' },
    reason: { type: String, required: true },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    refundAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        'return_requested',
        'under_review',
        'approved',
        'pickup_scheduled',
        'received',
        'refund_initiated',
        'refunded',
        'rejected',
        'requested',
        'processed',
      ],
      default: 'return_requested',
      index: true,
    },
    adminNotes: { type: String, default: '' },
    approvedAt: { type: Date },
    pickupScheduledAt: { type: Date },
    receivedAt: { type: Date },
    refundInitiatedAt: { type: Date },
    refundedAt: { type: Date },
    rejectedAt: { type: Date },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export const ReturnRefund: Model<IReturnRefund> =
  mongoose.models.ReturnRefund ||
  mongoose.model<IReturnRefund>('ReturnRefund', ReturnRefundSchema);
