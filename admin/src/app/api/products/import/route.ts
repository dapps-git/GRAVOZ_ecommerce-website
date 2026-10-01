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

      // Collect Images (Image 1 through Image 10 or generic images list)
      const images: Array<{ url: string; alt: string }> = [];
      const imageKeys = [
        'image1', 'image2', 'image3', 'image4', 'image5', 'image6', 'image7', 'image8',
        'img1', 'img2', 'img3', 'img4', 'img5', 'img6', 'img7', 'img8',
        'images', 'imageurl', 'image', 'photo', 'photos'
      ];
      
      for (const key of imageKeys) {
        const val = normalizedRow[key];
        if (val && typeof val === 'string') {
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
      const colorsRaw = String(normalizedRow['colors'] || normalizedRow['color'] || 'Brown, Black');
      const colors = colorsRaw
        .split(/[,;\/|]+/)
        .map(c => c.trim())
        .filter(Boolean);

      // Color Variants parsing
      const colorVariantsRaw = String(normalizedRow['colorvariantimages'] || normalizedRow['colorvariants'] || normalizedRow['variants'] || '');
      const colorVariants: Array<{
        name: string;
        colorCode?: string;
        imageUrl?: string;
        images?: Array<{ url: string; alt: string }>;
        isAvailable: boolean;
      }> = [];

      // 1. Check for dedicated color columns:
      // - Method 1: Single bulk column per color (e.g. "Brown Images", "Black Images", "Tan Images", "Brown Photos", etc.)
      // - Granular columns (e.g. "Brown Image 1" .. "Brown Image 5", etc.)
      const processedColors = new Set<string>();

      // First check all colors specified in colors list
      for (const cName of colors) {
        const cleanColorPrefix = cName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cImages: Array<{ url: string; alt: string }> = [];

        // Check bulk column like brownimages, brownphotos, brownimage, brownurls
        const bulkKeys = [
          `${cleanColorPrefix}images`,
          `${cleanColorPrefix}photos`,
          `${cleanColorPrefix}image`,
          `${cleanColorPrefix}photo`,
          `${cleanColorPrefix}urls`,
          `${cleanColorPrefix}url`,
        ];
        for (const bKey of bulkKeys) {
          const bulkVal = normalizedRow[bKey];
          if (bulkVal && typeof bulkVal === 'string') {
            const bulkUrls = bulkVal
              .split(/[,;\n\r]+/)
              .map((u) => u.trim())
              .filter((u) => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));
            for (const u of bulkUrls) {
              if (!cImages.some((img) => img.url === u)) {
                cImages.push({ url: u, alt: `${name} ${cName} - view ${cImages.length + 1}` });
              }
            }
          }
        }

        // Also check numbered columns like brownimage1..10, brownimg1..10
        for (let i = 1; i <= 10; i++) {
          const possibleKeys = [
            `${cleanColorPrefix}image${i}`,
            `${cleanColorPrefix}img${i}`,
            `${cleanColorPrefix}photo${i}`,
          ];
          for (const key of possibleKeys) {
            const val = normalizedRow[key];
            if (val && typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) {
              if (!cImages.some((img) => img.url === val.trim())) {
                cImages.push({ url: val.trim(), alt: `${name} ${cName} - view ${cImages.length + 1}` });
              }
            }
          }
        }

        if (cImages.length > 0) {
          colorVariants.push({
            name: cName,
            imageUrl: cImages[0].url,
            images: cImages,
            isAvailable: true,
          });
          processedColors.add(cName.toLowerCase());
        }
      }

      // Auto-discover any additional color columns in the row (e.g. "Tan Images", "Navy Images", etc.)
      for (const [rowKey, rowVal] of Object.entries(normalizedRow)) {
        if (typeof rowVal === 'string' && (rowVal.startsWith('http') || rowVal.startsWith('/'))) {
          const match = rowKey.match(/^([a-z]+)(images|photos|image|photo)$/);
          if (match && match[1] && !['product', 'item', 'main', 'sub', 'brand', 'cat'].includes(match[1])) {
            const detectedColorRaw = match[1];
            if (!processedColors.has(detectedColorRaw) && !['img', 'image', 'photo', 'images', 'photos'].includes(detectedColorRaw)) {
              const detectedColor = detectedColorRaw.charAt(0).toUpperCase() + detectedColorRaw.slice(1);
              const extraUrls = rowVal
                .split(/[,;\n\r]+/)
                .map((u) => u.trim())
                .filter((u) => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));
              if (extraUrls.length > 0) {
                const variantImgs = extraUrls.map((u, idx) => ({
                  url: u,
                  alt: `${name} ${detectedColor} - view ${idx + 1}`,
                }));
                colorVariants.push({
                  name: detectedColor,
                  imageUrl: variantImgs[0].url,
                  images: variantImgs,
                  isAvailable: true,
                });
                processedColors.add(detectedColorRaw);
                if (!colors.includes(detectedColor)) {
                  colors.push(detectedColor);
                }
              }
            }
          }
        }
      }

      // 2. If no per-color columns found, check Color Variant Images format (e.g. "Brown: url1, url2 | Black: url3, url4")
      if (colorVariants.length === 0 && colorVariantsRaw) {
        const colorBlocks = colorVariantsRaw.split(/[|;]\s*(?=[A-Za-z0-9\s_-]+:)/).filter(Boolean);
        for (const block of colorBlocks) {
          const colonIdx = block.indexOf(':');
          if (colonIdx > 0) {
            const cName = block.slice(0, colonIdx).trim();
            const cUrlsRaw = block.slice(colonIdx + 1).trim();
            const cUrls = cUrlsRaw.split(/[,;\s]+/).map(u => u.trim()).filter(u => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));
            
            const variantImages = cUrls.map((u, i) => ({
              url: u,
              alt: `${name} ${cName} view ${i + 1}`
            }));

            colorVariants.push({
              name: cName,
              imageUrl: cUrls[0] || (images[0]?.url || ''),
              images: variantImages.length > 0 ? variantImages : (images.length > 0 ? images : []),
              isAvailable: true,
            });
          }
        }
      }

      // If colorVariants have real photos, ensure the main product `images` array uses them instead of placeholder
      let finalImages = images.filter(img => !img.url.includes('placeholder.svg') && !img.url.includes('photo-1542291026-7eec264c27ff'));
      if (finalImages.length === 0 && colorVariants.length > 0) {
        for (const cv of colorVariants) {
          if (cv.images && cv.images.length > 0) {
            for (const img of cv.images) {
              if (!finalImages.some(fi => fi.url === img.url)) {
                finalImages.push(img);
              }
            }
          } else if (cv.imageUrl) {
            finalImages.push({ url: cv.imageUrl, alt: `${name} - ${cv.name}` });
          }
        }
      }
      if (finalImages.length === 0) {
        finalImages = images;
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
        images: finalImages,
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
