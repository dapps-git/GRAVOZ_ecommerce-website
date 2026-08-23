const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'Super Admin' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'superadmin', enum: ['superadmin', 'manager', 'editor'] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
