const mongoose = require('mongoose');

const InfluencerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    affiliateCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: { type: Number, default: 5, min: 0 },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Influencer || mongoose.model('Influencer', InfluencerSchema);

