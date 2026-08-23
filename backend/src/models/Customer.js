const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const ActivityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    addresses: [AddressSchema],
    rewardPoints: { type: Number, default: 0 },
    referralCode: { type: String, required: true, unique: true, index: true },
    referredBy: { type: String, default: '' },
    activityLogs: [ActivityLogSchema],
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    tier: { type: String, default: 'Silver', enum: ['Silver', 'Gold', 'Platinum'] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
