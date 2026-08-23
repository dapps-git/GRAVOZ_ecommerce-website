const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gravoz';

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection;
  
  // 1. Seed Admin
  const adminPasswordHash = await bcrypt.hash('admin123456', 10);
  await db.collection('admins').deleteMany({});
  await db.collection('admins').insertOne({
    name: 'Super Admin',
    email: 'admin@gravoz.com',
    passwordHash: adminPasswordHash,
    role: 'superadmin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('✔ Super Admin created: admin@gravoz.com / admin123456');

  // 2. Seed Categories
  await db.collection('categories').deleteMany({});
  const menCat = await db.collection('categories').insertOne({
    name: "Men's Footwear",
    slug: 'mens-footwear',
    targetAudience: 'Men',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
    subCategories: ['Sneakers', 'Boots', 'Formal Oxford', 'Running'],
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const womenCat = await db.collection('categories').insertOne({
    name: "Women's Footwear",
    slug: 'womens-footwear',
    targetAudience: 'Women',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800',
    subCategories: ['Heels', 'Sneakers', 'Sandals', 'Running'],
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const babyCat = await db.collection('categories').insertOne({
    name: "Baby & Toddler Footwear",
    slug: 'baby-toddler-footwear',
    targetAudience: 'Babies',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800',
    subCategories: ['First Walkers', 'Booties', 'Soft Sole Sandals'],
    displayOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('✔ Categories created (Men, Women, Babies)');

  // 3. Seed Products (3 photos per product requirement)
  await db.collection('products').deleteMany({});

  const sampleProducts = [
    {
      name: 'GRAVOZ Men Apex Air Runner',
      slug: 'gravoz-men-apex-air-runner',
      sku: 'GRV-MEN-001',
      description: 'Ultra lightweight ergonomic running shoe for high performance training.',
      targetAudience: 'Men',
      category: menCat.insertedId,
      subCategory: 'Running',
      images: [
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800', alt: "Men's Apex Air Runner Profile View" },
        { url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800', alt: "Men's Apex Air Runner Sole Detail" },
        { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800', alt: "Men's Apex Air Runner Top View" },
      ],
      price: 149.99,
      discountPrice: 119.99,
      stock: 24,
      sizes: ['8', '9', '10', '11', '12'],
      colors: ['Red/Black', 'Pure White', 'Midnight Blue'],
      isBestSeller: true,
      isFeatured: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'GRAVOZ Women Velocity Aero',
      slug: 'gravoz-women-velocity-aero',
      sku: 'GRV-WMN-002',
      description: 'Dynamic responsive cushioning sneakers designed for maximum agility and comfort.',
      targetAudience: 'Women',
      category: womenCat.insertedId,
      subCategory: 'Sneakers',
      images: [
        { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800', alt: "Women's Velocity Aero Main View" },
        { url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800', alt: "Women's Velocity Aero Heel Detail" },
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800', alt: "Women's Velocity Aero Side Profile" },
      ],
      price: 139.99,
      discountPrice: 109.99,
      stock: 18,
      sizes: ['6', '7', '8', '9'],
      colors: ['Pastel Pink', 'Teal White', 'Lavender'],
      isBestSeller: true,
      isFeatured: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'GRAVOZ Baby First-Step Cloud Walker',
      slug: 'gravoz-baby-first-step-cloud-walker',
      sku: 'GRV-BABY-003',
      description: 'Soft non-slip sole baby walker for delicate growing feet.',
      targetAudience: 'Babies',
      category: babyCat.insertedId,
      subCategory: 'First Walkers',
      images: [
        { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800', alt: 'Baby Cloud Walker Soft Leather' },
        { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800', alt: 'Baby Cloud Walker Ankle Support' },
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800', alt: 'Baby Cloud Walker Sole View' },
      ],
      price: 45.00,
      discountPrice: 35.00,
      stock: 3,
      sizes: ['6-12M', '12-18M', '18-24M'],
      colors: ['Sky Blue', 'Soft Yellow', 'Pure White'],
      isBestSeller: true,
      isFeatured: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.collection('products').insertMany(sampleProducts);
  console.log('✔ Products seeded for Men, Women & Babies with 3 photos per product!');

  // 4. Seed Orders
  await db.collection('orders').deleteMany({});
  await db.collection('orders').insertMany([
    {
      orderNumber: 'GRV-2026-1001',
      customer: {
        name: 'Alexander Wright',
        email: 'alex@example.com',
        phone: '+1 (555) 234-5678',
        shippingAddress: {
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62701',
          country: 'USA',
        },
      },
      items: [
        {
          name: 'GRAVOZ Men Apex Air Runner',
          size: '10',
          color: 'Red/Black',
          quantity: 1,
          price: 119.99,
        },
      ],
      subtotal: 119.99,
      tax: 6.00,
      shippingFee: 0,
      discountAmount: 0,
      totalAmount: 125.99,
      paymentStatus: 'paid',
      orderStatus: 'shipped',
      paymentMethod: 'Credit Card',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // 5. Seed Testimonials
  await db.collection('testimonials').deleteMany({});
  await db.collection('testimonials').insertMany([
    {
      customerName: 'Elena Rostova',
      roleOrLocation: 'Marathon Runner, NY',
      rating: 5,
      comment: 'GRAVOZ Men & Women Apex shoes are by far the best cushioned running shoes I have owned.',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      customerName: 'Marcus Vance',
      roleOrLocation: 'Parent of Toddler',
      rating: 5,
      comment: 'The Baby First-Step shoes are lightweight and extremely supportive.',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // 6. Seed Settings
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

  console.log('\n✅ Database seeding complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
