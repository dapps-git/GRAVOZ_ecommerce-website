const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'GRAVOZ Footwear' },
    storeTagline: { type: String, default: 'Premium Handcrafted Footwear & Leather Collections' },
    contactEmail: { type: String, default: 'support@gravoz.com' },
    contactPhone: { type: String, default: '+91 98765 43210' },
    gstinTaxId: { type: String, default: '32AAACL1902K1Z8' },
    currencySymbol: { type: String, default: '₹' },
    currencyCode: { type: String, default: 'INR' },
    taxRatePercent: { type: Number, default: 5 },
    freeShippingThreshold: { type: Number, default: 999 },
    codDeliveryCharge: { type: Number, default: 25 },
    flatShippingRate: { type: Number, default: 0 },
    referralRewardCredit: { type: Number, default: 100 },
    friendFirstOrderDiscountPercent: { type: Number, default: 15 },
    cloudinaryPreset: { type: String, default: 'gravoz_preset' },
    bannerMessage: { type: String, default: 'Welcome to GRAVOZ - Handcrafted Footwear for Men, Women & Babies' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
