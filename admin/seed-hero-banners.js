const mongoose = require('mongoose');
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

const MONGODB_URI = envUri || 'mongodb://127.0.0.1:27017/gravoz';

const BannerSchema = new mongoose.Schema({
  slot: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['home_banner', 'category_banner', 'duo_showcase'] },
  imageUrl: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  lifestyleUrl: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  productId: { type: String, default: '' },
  linkUrl: { type: String, default: '/products' },
  aspectRatio: { type: String, default: '1816/866' },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

const newHeroSlides = [
  {
    slot: 'hero_slide_2',
    name: 'Top Hero Slider (Slide 2)',
    category: 'home_banner',
    imageUrl: '/images/banner3.webp',
    title: 'Ultra Comfort Everyday Sandal',
    subtitle: 'Ergonomic footbed with shock absorption',
    linkUrl: '/products',
    aspectRatio: '1816/866',
    isActive: true,
    displayOrder: 2,
  },
  {
    slot: 'hero_slide_3',
    name: 'Top Hero Slider (Slide 3)',
    category: 'home_banner',
    imageUrl: '/images/banner4.webp',
    title: 'Seasonal Showcase',
    subtitle: 'New Season New Styles',
    linkUrl: '/products',
    aspectRatio: '1816/866',
    isActive: true,
    displayOrder: 3,
  },
  {
    slot: 'hero_slide_4',
    name: 'Top Hero Slider (Slide 4)',
    category: 'home_banner',
    imageUrl: '/images/banner5.webp',
    title: 'Daily Collection',
    subtitle: 'Everyday elegance crafted for you',
    linkUrl: '/products',
    aspectRatio: '1816/866',
    isActive: true,
    displayOrder: 4,
  },
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

  // Update Hero Slide 1 name
  await Banner.findOneAndUpdate(
    { slot: 'hero' },
    { $set: { name: 'Top Hero Slider (Slide 1)', displayOrder: 1 } },
    { upsert: true }
  );
  console.log('Updated slot hero to Top Hero Slider (Slide 1)');

  for (const slide of newHeroSlides) {
    const existing = await Banner.findOne({ slot: slide.slot });
    if (!existing) {
      await Banner.create(slide);
      console.log('Created banner slide:', slide.slot);
    } else {
      console.log('Banner slide already exists:', slide.slot);
    }
  }

  // Adjust display orders for other banners
  await Banner.findOneAndUpdate({ slot: 'secondary' }, { $set: { displayOrder: 5 } });
  await Banner.findOneAndUpdate({ slot: 'comfort_sandal' }, { $set: { displayOrder: 6 } });
  await Banner.findOneAndUpdate({ slot: 'promo_strip' }, { $set: { displayOrder: 7 } });
  await Banner.findOneAndUpdate({ slot: 'daily_collection' }, { $set: { displayOrder: 8 } });

  const total = await Banner.find({ category: 'home_banner' }).countDocuments();
  console.log('Total home banners in DB:', total);

  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
