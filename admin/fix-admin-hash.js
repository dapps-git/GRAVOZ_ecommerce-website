const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gravoz');
  const pass = 'gravoxadmin#0289';
  const hash = await bcrypt.hash(pass, 10);
  console.log('New hash:', hash);

  const ok = await bcrypt.compare(pass, hash);
  console.log('Hash verifies locally:', ok);

  await mongoose.connection.db.collection('admins').updateOne(
    { email: 'gravoxshopadmin@gmail.com' },
    { $set: { passwordHash: hash, updatedAt: new Date() } }
  );
  console.log('Updated in DB');

  const admin = await mongoose.connection.db.collection('admins').findOne({ email: 'gravoxshopadmin@gmail.com' });
  const dbOk = await bcrypt.compare(pass, admin.passwordHash);
  console.log('DB hash verifies:', dbOk);

  await mongoose.disconnect();
  console.log('Done');
}

fix().catch(e => console.error('Error:', e.message));
