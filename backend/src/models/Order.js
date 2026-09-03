const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
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

const AddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true }, // matches Customer._id string
    customerEmail: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shippingAddress: { type: AddressSchema, required: true },
    items: [OrderItemSchema],
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
    statusHistory: [StatusHistorySchema],
    estimatedDelivery: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
