const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://gravozshoes_db_user:9zEDpISGySjZ2gcA@cluster0.b8byz7c.mongodb.net/GRAVOX';

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  console.log('Found total products in DB:', products.length);

  let updated = 0;
  for (const p of products) {
    let images = Array.isArray(p.images) ? p.images : [];
    const colorVariants = Array.isArray(p.colorVariants) ? p.colorVariants : [];

    // Filter out dummy red shoe image
    images = images.filter(img => img && img.url && !img.url.includes('photo-1542291026-7eec264c27ff') && !img.url.includes('placeholder.svg'));

    // If main images is empty, grab from color variants
    if (images.length === 0 && colorVariants.length > 0) {
      for (const cv of colorVariants) {
        if (cv.images && Array.isArray(cv.images) && cv.images.length > 0) {
          for (const img of cv.images) {
            if (img && img.url && !img.url.includes('photo-1542291026-7eec264c27ff')) {
              images.push(img);
            }
          }
        } else if (cv.imageUrl && !cv.imageUrl.includes('photo-1542291026-7eec264c27ff')) {
          images.push({ url: cv.imageUrl, alt: p.name });
        }
      }
    }

    if (images.length > 0) {
      await db.collection('products').updateOne({ _id: p._id }, { $set: { images } });
      updated++;
    }
  }

  console.log(`Cleaned and synced images for ${updated} products successfully!`);
  await mongoose.disconnect();
}

cleanup().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
