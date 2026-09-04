import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
  imageUrl?: string;
}

export interface IShippingAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: IShippingAddress;
  items: IOrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'UPI' | 'Card' | 'Wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus:
    | 'ordered'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'return_requested'
    | 'under_review'
    | 'return_approved'
    | 'pickup_scheduled'
    | 'return_received'
    | 'refund_initiated'
    | 'refunded'
    | 'returned'
    | 'return_rejected';
  returnDetails?: {
    reason?: string;
    description?: string;
    images?: string[];
    status?:
      | 'return_requested'
      | 'under_review'
      | 'approved'
      | 'pickup_scheduled'
      | 'received'
      | 'refund_initiated'
      | 'refunded'
      | 'rejected';
    requestedAt?: Date;
    approvedAt?: Date;
    pickupScheduledAt?: Date;
    receivedAt?: Date;
    refundInitiatedAt?: Date;
    refundedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
  };
  statusHistory: IStatusHistory[];
  estimatedDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, default: '600040' },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, default: '', index: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'Card', 'Wallet'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'ordered',
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'return_requested',
        'under_review',
        'return_approved',
        'pickup_scheduled',
        'return_received',
        'refund_initiated',
        'refunded',
        'returned',
        'return_rejected',
      ],
      default: 'ordered',
      index: true,
    },
    returnDetails: {
      type: {
        reason: { type: String },
        description: { type: String },
        images: [{ type: String }],
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
          ],
        },
        requestedAt: { type: Date },
        approvedAt: { type: Date },
        pickupScheduledAt: { type: Date },
        receivedAt: { type: Date },
        refundInitiatedAt: { type: Date },
        refundedAt: { type: Date },
        rejectedAt: { type: Date },
        rejectionReason: { type: String },
      },
      required: false,
      _id: false,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    estimatedDelivery: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
