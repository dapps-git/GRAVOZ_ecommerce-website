import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId?: string;
  product?: mongoose.Types.ObjectId;
  name: string;
  size: string;
  color?: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  image?: string;
}

export interface IShippingAddress {
  name?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrderCustomer {
  name: string;
  email: string;
  phone: string;
  shippingAddress?: IShippingAddress;
}

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customer?: IOrderCustomer;
  shippingAddress?: IShippingAddress;
  items: IOrderItem[];
  subtotal: number;
  tax?: number;
  shippingFee?: number;
  discountAmount?: number;
  couponCode?: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus:
    | 'ordered'
    | 'confirmed'
    | 'pending'
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
  statusHistory?: IStatusHistory[];
  estimatedDelivery?: Date;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    imageUrl: { type: String },
    image: { type: String },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: { type: String },
    phone: { type: String },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
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

const OrderSchema: Schema<IOrder> = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, default: '', index: true },
    customerName: { type: String },
    customerEmail: { type: String, index: true },
    customerPhone: { type: String },
    customer: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      shippingAddress: { type: ShippingAddressSchema },
    },
    shippingAddress: { type: ShippingAddressSchema },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    totalAmount: { type: Number, required: true, min: 0 },
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
        'pending',
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
    paymentMethod: { type: String, default: 'COD' },
    transactionId: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderStatus: 1, paymentStatus: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
