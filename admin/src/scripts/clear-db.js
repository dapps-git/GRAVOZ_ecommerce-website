const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gravoz';

async function clearAndSeedSuperAdmin() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection;

  // 1. Wipe all static sample products, categories, orders, testimonials
  await db.collection('products').deleteMany({});
  await db.collection('categories').deleteMany({});
  await db.collection('orders').deleteMany({});
  await db.collection('testimonials').deleteMany({});
  await db.collection('returnrefunds').deleteMany({});
  await db.collection('paymentlogs').deleteMany({});

  console.log('✔ Wiped all static sample products, categories, orders & testimonials!');

  // 2. Ensure Super Admin account exists with hashed password
  const adminEmail = process.env.ADMIN_EMAIL || 'gravoxshopadmin@gmail.com';
  const rawAdminPass = process.env.ADMIN_PASSWORD || 'admin123456';
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || 
    (rawAdminPass.startsWith('$2') ? rawAdminPass : await bcrypt.hash(rawAdminPass, 10));

  await db.collection('admins').deleteMany({});
  await db.collection('admins').insertOne({
    name: 'Super Admin',
    email: adminEmail,
    passwordHash: adminPasswordHash,
    role: 'superadmin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`✔ Super Admin account ready: ${adminEmail}`);

  // 3. Initialize default Store Settings
  await db.collection('settings').deleteMany({});
  await db.collection('settings').insertOne({
    storeName: 'GRAVOZ Shoes',
    contactEmail: 'support@gravoz.com',
    contactPhone: '+1 (800) 555-GRAV',
    currencySymbol: '$',
    currencyCode: 'USD',
    taxRatePercent: 5,
    freeShippingThreshold: 100,
    flatShippingRate: 15,
    bannerMessage: 'Welcome to GRAVOZ - Premium Shoes for Men, Women & Babies',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('✔ Default store settings ready!');

  console.log('\n✅ Database is now 100% clean and ready for dynamic product additions!');
  await mongoose.disconnect();
}

clearAndSeedSuperAdmin().catch((err) => {
  console.error('Clear error:', err);
  process.exit(1);
});
