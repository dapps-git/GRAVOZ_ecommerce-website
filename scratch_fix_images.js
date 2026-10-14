const mongoose = require('mongoose');

async function fixImages() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  const db = mongoose.connection;
  const products = await db.collection('products').find().toArray();
  for (const p of products) {
    if (p.images && p.images.length > 1 && p.images[0].url.includes('placeholder.svg')) {
      const realImages = p.images.filter((img) => !img.url.includes('placeholder.svg'));
      await db.collection('products').updateOne({ _id: p._id }, { $set: { images: realImages } });
      console.log('Fixed product images for:', p.name, 'Now has:', realImages.length, 'images. First:', realImages[0]?.url);
    }
  }
  await mongoose.disconnect();
}

fixImages().catch(console.error);
