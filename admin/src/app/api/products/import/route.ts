import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { invalidateCache } from '@/lib/redis';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded. Please select an Excel or CSV file.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: 'The uploaded workbook does not contain any sheets.' }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: 'The uploaded file is empty or has no valid rows.' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: Array<{ row: number; sku?: string; name?: string; message: string }> = [];

    // Pre-fetch categories for fast mapping
    const existingCategories = await Category.find({}).lean();
    const categoryMap = new Map<string, any>();
    for (const cat of existingCategories) {
      categoryMap.set(cat.name.toLowerCase().trim(), cat);
    }

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // Row number in Excel (header is row 1)

      // Normalize row keys by converting to lowercase and stripping punctuation
      const normalizedRow: Record<string, any> = {};
      for (const [key, val] of Object.entries(row)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        normalizedRow[cleanKey] = typeof val === 'string' ? val.trim() : val;
      }

      const name = normalizedRow['name'] || normalizedRow['productname'] || normalizedRow['title'] || '';
      const priceVal = normalizedRow['price'] || normalizedRow['mrp'] || normalizedRow['regularprice'] || '';
      const price = parseFloat(String(priceVal).replace(/[^0-9.]/g, ''));

      if (!name || isNaN(price) || price <= 0) {
        errors.push({
          row: rowNum,
          name: name || 'Unnamed Product',
          message: 'Product Name and a valid positive Price are required.',
        });
        continue;
      }

      // SKU handling
      let sku = String(normalizedRow['sku'] || normalizedRow['itemcode'] || '').trim();
      if (!sku) {
        const slugPrefix = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 10);
        sku = `GRV-${slugPrefix.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }

      // Target Audience
      let targetAudience: 'Men' | 'Women' | 'Babies' = 'Men';
      const audienceInput = String(normalizedRow['targetaudience'] || normalizedRow['audience'] || normalizedRow['gender'] || '').toLowerCase();
      if (audienceInput.includes('women') || audienceInput.includes('female') || audienceInput.includes('girl') || audienceInput.includes('ladies')) {
        targetAudience = 'Women';
      } else if (audienceInput.includes('babi') || audienceInput.includes('baby') || audienceInput.includes('kid') || audienceInput.includes('child')) {
        targetAudience = 'Babies';
      }

      // Discount Price
      const discountVal = normalizedRow['discountprice'] || normalizedRow['saleprice'] || normalizedRow['offerprice'] || '';
      const discountPrice = discountVal ? parseFloat(String(discountVal).replace(/[^0-9.]/g, '')) : undefined;

      // Stock
      const stockVal = normalizedRow['stock'] || normalizedRow['quantity'] || normalizedRow['qty'] || normalizedRow['inventory'] || '50';
      const stock = parseInt(String(stockVal).replace(/[^0-9]/g, ''), 10) || 50;

      // Category handling
      const categoryName = String(normalizedRow['category'] || normalizedRow['categoryname'] || 'Footwear').trim();
      let categoryId: string | undefined;
      const catKey = categoryName.toLowerCase();

      if (categoryMap.has(catKey)) {
        categoryId = categoryMap.get(catKey)._id.toString();
      } else if (categoryName) {
        // Auto-create category if new
        try {
          const catSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const newCat = await Category.create({
            name: categoryName,
            slug: `${catSlug}-${Date.now().toString().slice(-4)}`,
            targetAudience,
            description: `${categoryName} Collection`,
            image: '/categories/footwear.jpg',
            isActive: true,
          });
          categoryMap.set(catKey, newCat);
          categoryId = newCat._id.toString();
        } catch (catErr) {
          console.warn('Category creation notice:', catErr);
        }
      }

      const subCategory = String(normalizedRow['subcategory'] || normalizedRow['type'] || 'Shoes').trim();
      const material = String(normalizedRow['material'] || '').trim();
      const description = String(normalizedRow['description'] || normalizedRow['desc'] || `${name} premium quality footwear.`).trim();

      // Collect Images (Image 1 through Image 5 or generic images list)
      const images: Array<{ url: string; alt: string }> = [];
      const imageKeys = ['image1', 'image2', 'image3', 'image4', 'image5', 'img1', 'img2', 'img3', 'img4', 'img5', 'images', 'imageurl', 'image'];
      
      for (const key of imageKeys) {
        const val = normalizedRow[key];
        if (val && typeof val === 'string') {
          // If contains multiple URLs separated by commas or semicolons
          const urls = val.split(/[,;\n]+/).map(u => u.trim()).filter(u => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));
          for (const u of urls) {
            if (!images.some(img => img.url === u)) {
              images.push({ url: u, alt: `${name} - view ${images.length + 1}` });
            }
          }
        }
      }

      // Default placeholder image if no images specified
      if (images.length === 0) {
        images.push({
          url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
          alt: `${name} photo`,
        });
      }

      // Sizes parsing
      const sizesRaw = String(normalizedRow['sizes'] || normalizedRow['size'] || '6, 7, 8, 9, 10, 11');
      const sizes = sizesRaw
        .split(/[,;\/|]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const sizeAvailability = sizes.map(s => ({
        size: s,
        isAvailable: true,
        stock: Math.max(1, Math.floor(stock / (sizes.length || 1))),
      }));

      // Colors parsing
      const colorsRaw = String(normalizedRow['colors'] || normalizedRow['color'] || 'Black, Brown, Tan');
      const colors = colorsRaw
        .split(/[,;\/|]+/)
        .map(c => c.trim())
        .filter(Boolean);

      // Color Variants parsing (e.g. "Black:http://img1.jpg; White:http://img2.jpg")
      const colorVariantsRaw = String(normalizedRow['colorvariantimages'] || normalizedRow['colorvariants'] || '');
      const colorVariants: Array<{
        name: string;
        colorCode?: string;
        imageUrl?: string;
        images?: Array<{ url: string; alt: string }>;
        isAvailable: boolean;
      }> = [];

      if (colorVariantsRaw) {
        const pairs = colorVariantsRaw.split(/;\s*/).filter(Boolean);
        for (const pair of pairs) {
          const [cName, cUrl] = pair.split(/:(https?:\/\/.*)/i).filter(Boolean);
          if (cName) {
            const cleanCName = cName.replace(/:/g, '').trim();
            const cleanCUrl = cUrl ? cUrl.trim() : (images[0]?.url || '');
            colorVariants.push({
              name: cleanCName,
              imageUrl: cleanCUrl,
              images: cleanCUrl ? [{ url: cleanCUrl, alt: `${name} ${cleanCName}` }] : [],
              isAvailable: true,
            });
          }
        }
      } else {
        // Create standard color variants from colors list
        for (let i = 0; i < colors.length; i++) {
          const cName = colors[i];
          const imgUrl = images[i]?.url || images[0]?.url || '';
          colorVariants.push({
            name: cName,
            imageUrl: imgUrl,
            images: imgUrl ? [{ url: imgUrl, alt: `${name} ${cName}` }] : [],
            isAvailable: true,
          });
        }
      }

      // Badges and flags
      const isBestSellerRaw = String(normalizedRow['isbestseller'] || normalizedRow['bestseller'] || '').toLowerCase();
      const isBestSeller = isBestSellerRaw === 'true' || isBestSellerRaw === '1' || isBestSellerRaw === 'yes';

      const isFeaturedRaw = String(normalizedRow['isfeatured'] || normalizedRow['featured'] || '').toLowerCase();
      const isFeatured = isFeaturedRaw === 'true' || isFeaturedRaw === '1' || isFeaturedRaw === 'yes';

      const statusRaw = String(normalizedRow['status'] || 'active').toLowerCase();
      const status = statusRaw.includes('draft') ? 'draft' : statusRaw.includes('arch') ? 'archived' : 'active';

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + sku.toLowerCase().replace(/[^a-z0-9]+/g, '');

      // Upsert product
      const productPayload = {
        name,
        slug,
        sku,
        targetAudience,
        category: categoryId,
        subCategory,
        price,
        discountPrice: discountPrice && discountPrice < price ? discountPrice : undefined,
        stock,
        sizes: sizes.length ? sizes : ['6', '7', '8', '9', '10', '11'],
        sizeAvailability,
        colors: colors.length ? colors : ['Black', 'Brown'],
        colorVariants,
        images,
        material,
        description,
        isBestSeller,
        isFeatured,
        status,
      };

      const existing = await Product.findOne({ sku });
      if (existing) {
        await Product.updateOne({ _id: existing._id }, { $set: productPayload });
        updatedCount++;
      } else {
        await Product.create(productPayload);
        createdCount++;
      }
    }

    // Invalidate product caches
    try {
      await invalidateCache('products*');
    } catch (e) {
      console.warn('Cache invalidate error on import:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${createdCount} created, ${updatedCount} updated.`,
      totalRows: rawRows.length,
      created: createdCount,
      updated: updatedCount,
      errors,
    });
  } catch (error: any) {
    console.error('Import products error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process Excel/CSV import' }, { status: 500 });
  }
}
