/**
 * Seed Admin - Creates or updates the gravox admin account in MongoDB
 * Run: node seed-admin.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const fs = require('fs');
const path = require('path');

let envUri = process.env.MONGODB_URI;
if (!envUri) {
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    if (match) envUri = match[1].trim();
  } catch (e) {}
}

const MONGODB_URI = envUri;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment or .env.local');
  process.exit(1);
}

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin'], default: 'superadmin' },
}, { timestamps: true });

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log('Connected!');

  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

  const email = process.env.ADMIN_EMAIL || 'gravoxshopadmin@gmail.com';
  const rawAdminPass = process.env.ADMIN_PASSWORD;
  const passwordHash =
    process.env.ADMIN_PASSWORD_HASH ||
    (rawAdminPass?.startsWith('$2')
      ? rawAdminPass
      : rawAdminPass
      ? await bcrypt.hash(rawAdminPass, 10)
      : null);

  if (!passwordHash) {
    console.error('ADMIN_PASSWORD_HASH or ADMIN_PASSWORD required.');
    process.exit(1);
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'superadmin';
    existing.name = 'Gravox Admin';
    await existing.save();
    console.log('✅ Admin updated:', existing.email);
  } else {
    const admin = await Admin.create({
      name: 'Gravox Admin',
      email,
      passwordHash,
      role: 'superadmin',
    });
    console.log('✅ Admin created:', admin.email);
  }

  await mongoose.disconnect();
  console.log(`Done. You can now login with ${email}`);
}

main().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
