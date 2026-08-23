import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReturnRefund extends Document {
  order: mongoose.Types.ObjectId;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  refundAmount: number;
  status: 'requested' | 'approved' | 'rejected' | 'processed';
  adminNotes?: string;
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
    reason: { type: String, required: true },
    refundAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'processed'],
      default: 'requested',
      index: true,
    },
    adminNotes: { type: String, default: '' },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export const ReturnRefund: Model<IReturnRefund> =
  mongoose.models.ReturnRefund ||
  mongoose.model<IReturnRefund>('ReturnRefund', ReturnRefundSchema);
