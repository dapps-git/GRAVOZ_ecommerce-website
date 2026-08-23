import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentLog extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  gateway: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  rawResponse?: string;
  createdAt: Date;
}

const PaymentLogSchema: Schema<IPaymentLog> = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    gateway: { type: String, default: 'Stripe' },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      required: true,
      index: true,
    },
    rawResponse: { type: String },
  },
  { timestamps: true }
);

export const PaymentLog: Model<IPaymentLog> =
  mongoose.models.PaymentLog || mongoose.model<IPaymentLog>('PaymentLog', PaymentLogSchema);
