const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['flash_sale', 'bogo', 'seasonal', 'clearance'] },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    bannerImageUrl: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, default: 'active', enum: ['active', 'scheduled', 'expired'], index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Promotion || mongoose.model('Promotion', PromotionSchema);
