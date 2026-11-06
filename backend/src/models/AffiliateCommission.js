const mongoose = require('mongoose');

const AffiliateCommissionSchema = new mongoose.Schema(
  {
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Influencer',
      required: true,
      index: true,
    },
    influencerName: { type: String, default: '' },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    customerId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
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

module.exports =
  mongoose.models.AffiliateCommission ||
  mongoose.model('AffiliateCommission', AffiliateCommissionSchema);

