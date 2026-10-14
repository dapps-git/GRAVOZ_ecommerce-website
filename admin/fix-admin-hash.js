const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function fix() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI required');
  await mongoose.connect(uri);
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) throw new Error('ADMIN_PASSWORD required');
  const hash = await bcrypt.hash(pass, 10);
  console.log('New hash generated');

  const adminEmail = process.env.ADMIN_EMAIL || 'gravoxshopadmin@gmail.com';
  await mongoose.connection.db.collection('admins').updateOne(
    { email: adminEmail },
    { $set: { passwordHash: hash, updatedAt: new Date() } }
  );
  console.log('Updated in DB');

  const admin = await mongoose.connection.db.collection('admins').findOne({ email: adminEmail });
  const dbOk = await bcrypt.compare(pass, admin.passwordHash);
  console.log('DB hash verifies:', dbOk);

  await mongoose.disconnect();
  console.log('Done');
}

fix().catch(e => console.error('Error:', e.message));
