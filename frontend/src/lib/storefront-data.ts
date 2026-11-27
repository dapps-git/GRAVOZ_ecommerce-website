import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Banner } from '@/models/Banner';
import { Category } from '@/models/Category';
import { Brand } from '@/models/Brand';
import { HomeSection } from '@/models/HomeSection';
import { Product } from '@/models/Product';
import { Review } from '@/models/Review';
import { Addon } from '@/models/Addon';

const CACHE_TTL_MS = 30 * 1000; // 30 seconds in-memory cache + ISR alignment
const PRODUCT_DETAIL_CACHE_TTL_MS = 30 * 1000;

interface StorefrontCatalogSnapshot {
  banners: Record<string, any>;
  categories: Array<{
    _id: string;
    key: string;
    name: string;
    title: string;
    slug: string;
    targetAudience?: string;
    href: string;
    imageUrl: string;
  }>;
  brands: Array<{
    _id: string;
    name: string;
    title?: string;
    slug?: string;
    logoUrl?: string;
  }>;
  products: any[];
  homeSections: Record<string, any>;
  timestamp: number;
}

export interface ProductDetailSnapshot {
  product: any | null;
  reviews: any[];
  avgRating: number;
  addons: any[];
  hasServerData: boolean;
  timestamp: number;
}

declare global {
  // eslint-disable-next-line no-var
  var storefrontSnapshotCache: StorefrontCatalogSnapshot | undefined;
  // eslint-disable-next-line no-var
  var storefrontSnapshotPromise: Promise<StorefrontCatalogSnapshot> | undefined;
  // eslint-disable-next-line no-var
  var storefrontProductDetailCache: Map<string, ProductDetailSnapshot> | undefined;
  // eslint-disable-next-line no-var
  var storefrontAddonsCache: { addons: any[]; timestamp: number } | undefined;
}

const SECTION_FLAG_MAP: Record<string, string> = {
  best_sellers: 'isBestSeller',
  top_selling: 'isTopSeller',
  latest_products: 'isLatest',
  featured_products: 'isFeatured',
};

const SECTION_DEFAULTS: Record<string, { title: string; subtitle: string; displayOrder: number }> = {
  best_sellers: { title: 'Best Sellers', subtitle: 'Our most loved and iconic designs', displayOrder: 1 },
  top_selling: { title: 'Top Selling', subtitle: 'Trending styles chosen by thousands', displayOrder: 2 },
  latest_products: { title: 'Latest Arrivals', subtitle: 'Fresh new season silhouettes', displayOrder: 3 },
  featured_products: { title: 'Featured Collection', subtitle: 'Handpicked handcrafted perfection', displayOrder: 4 },
};

function mapColorSwatches(p: any): Array<{ name: string; colorCode: string }> {
  if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
    return p.colorVariants
      .filter((v: any) => v && v.name)
      .map((v: any) => ({ name: String(v.name), colorCode: v.colorCode || '#1a1a1a' }));
  }
  if (Array.isArray(p.colors) && p.colors.length > 0) {
    return p.colors.filter(Boolean).map((c: string) => ({
      name: String(c),
      colorCode:
        c.toLowerCase() === 'black' ? '#1a1a1a' :
        c.toLowerCase() === 'brown' ? '#4a2c11' :
        c.toLowerCase() === 'tan' ? '#c28b57' :
        c.toLowerCase() === 'red' ? '#dc2626' :
        c.toLowerCase() === 'olive' ? '#556b2f' :
        c.toLowerCase() === 'pink' ? '#f4a6b8' :
        c.toLowerCase() === 'white' ? '#f8f8f8' :
        c.toLowerCase() === 'navy' ? '#1a2a40' : '#1a1a1a',
    }));
  }
  return [];
}

function buildSectionItemsFromCatalog(products: any[], flagField: string, limit = 8) {
  return products
    .filter((p) => Boolean(p[flagField]))
    .slice(0, limit)
    .map((p) => {
      const imgs: string[] = Array.isArray(p.imageUrls) ? p.imageUrls : [];
      const mainImg = imgs[0] || '/products/placeholder.svg';
      const insetImg = imgs[1] || mainImg;
      const price = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
      const origPrice = p.price !== price ? p.price : undefined;

      const sizes = Array.isArray(p.sizeAvailability) && p.sizeAvailability.length > 0
        ? p.sizeAvailability.map((s: any) => ({ size: String(s.size), isAvailable: Boolean(s.isAvailable) }))
        : Array.isArray(p.sizes)
        ? p.sizes.map((s: string) => ({ size: String(s), isAvailable: true }))
        : [];

      return {
        id: p._id,
        title: p.name,
        description: '',
        price,
        originalPrice: origPrice,
        imageUrl: mainImg,
        insetImageUrl: insetImg,
        images: imgs,
        sizes,
        colors: mapColorSwatches(p),
        linkUrl: `/products/${p.slug || p._id}`,
        productId: p._id,
        isAvailable: (p.stock || 0) > 0,
        displayOrder: 0,
      };
    });
}

function formatProductDetailRecord(
  product: any,
  catMap?: Map<string, any>,
  brandMap?: Map<string, any>,
  addonMap?: Map<string, any>
): any {
  const collectedImages: Array<{ url: string; alt?: string }> = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img: any) => {
      if (img?.url && !img.url.includes('placeholder.svg')) {
        collectedImages.push({ url: img.url, alt: img.alt || product.name });
      }
    });
  }

  if (Array.isArray(product.colorVariants)) {
    product.colorVariants.forEach((v: any) => {
      if (Array.isArray(v.images)) {
        v.images.forEach((img: any) => {
          if (img?.url && !img.url.includes('placeholder.svg') && !collectedImages.some((i) => i.url === img.url)) {
            collectedImages.push({ url: img.url, alt: img.alt || `${v.name || product.name} photo` });
          }
        });
      } else if (v.imageUrl && !collectedImages.some((i) => i.url === v.imageUrl)) {
        collectedImages.push({ url: v.imageUrl, alt: `${v.name || product.name} photo` });
      }
    });
  }

  if (collectedImages.length === 0) {
    collectedImages.push({ url: '/products/placeholder.svg', alt: product.name });
  }

  const finalSellingPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : (product.price || 0);
  const originalMrpPrice = product.discountPrice && product.discountPrice > 0 ? (product.price || product.discountPrice) : (product.originalPrice || product.price || 0);

  const additionalInfoObj: Record<string, string> = {
    'Material': product.material || 'Genuine Artisan Leather',
    'Occasion': product.occasion || 'Casual & Daily Wear',
    'Closure Type': product.closureType || 'Slip-On',
    'Strap Type': product.strapType || 'No Strap',
    'Shoe Type': product.shoeType || product.subCategory || 'Casual Shoes',
    'Target Gender': product.targetAudience || 'Men',
    'Age Range': product.ageRange || 'Adults',
    'Manufacturer': product.manufacturer || 'GRAVOZ Artisans Pvt. Ltd.',
    'HSN Code': product.hsnCode || '64032000',
    'GST': product.gst ? `${product.gst}%` : '12%',
    'Origin': 'India (Handcrafted)',
  };

  let formattedFeatures = '';
  if (Array.isArray(product.features)) {
    formattedFeatures = product.features.join('\n');
  } else if (typeof product.features === 'string') {
    formattedFeatures = product.features;
  }

  let resolvedBrand = 'GRAVOZ';
  if (typeof product.brand === 'object' && product.brand !== null) {
    resolvedBrand = product.brand.name || 'GRAVOZ';
  } else if (product.brand) {
    const mappedBrand = brandMap?.get(String(product.brand));
    resolvedBrand = mappedBrand?.name || String(product.brand);
  }

  let resolvedCategoryName = 'Footwear';
  let resolvedCategoryObj = product.category;
  if (typeof product.category === 'object' && product.category !== null) {
    resolvedCategoryName = product.category.name || 'Footwear';
  } else if (product.category) {
    const mappedCat = catMap?.get(String(product.category));
    if (mappedCat) {
      resolvedCategoryName = mappedCat.name || 'Footwear';
      resolvedCategoryObj = {
        _id: String(mappedCat._id),
        name: String(mappedCat.name),
        slug: mappedCat.slug,
        targetAudience: mappedCat.targetAudience,
      };
    } else {
      resolvedCategoryName = String(product.category);
    }
  }

  const resolvedAddons = Array.isArray(product.addons)
    ? product.addons
        .map((a: any) => {
          if (typeof a === 'object' && a !== null && a._id) return a;
          return addonMap?.get(String(a)) || null;
        })
        .filter((a: any) => a && a.isActive !== false)
    : undefined;

  return {
    ...product,
    category: resolvedCategoryObj,
    addons: resolvedAddons ?? product.addons,
    brand: resolvedBrand,
    categoryName: resolvedCategoryName,
    price: finalSellingPrice,
    originalPrice: originalMrpPrice,
    rating: product.rating || 5.0,
    reviewsCount: product.reviewsCount || 0,
    images: collectedImages,
    features: formattedFeatures,
    additionalInfo: product.additionalInfo || additionalInfoObj,
    noReturnRefundExchange: Boolean(product.noReturnRefundExchange),
    shippingAndReturn: product.shippingAndReturn || {
      shippingTitle: 'Complimentary Express Shipping',
      shippingDesc: 'Free delivery across all pin codes in India. Metro cities delivered within 2-4 business days.',
      returnTitle: product.noReturnRefundExchange ? 'No Return • No Refund • No Exchange' : '7-Day Hassle-Free Returns',
      returnDesc: product.noReturnRefundExchange
        ? 'Clearance / Old Stock Item: Sold as-is and strictly not eligible for return, doorstep exchange, or refund.'
        : 'Doorstep pickup and instant exchange if size or fit is not ideal.',
      warrantyTitle: '6-Month Manufacturing Warranty',
      warrantyDesc: 'Covers sole adhesion, stitching, and artisan leather construction.',
      paymentTitle: 'COD & Secure Prepaid',
      paymentDesc: 'Pay securely via UPI, Cards, Net Banking, or Cash on Delivery.',
    },
  };
}

function setCachedProductDetailEntry(keys: Array<string | undefined>, entry: ProductDetailSnapshot) {
  if (!global.storefrontProductDetailCache) {
    global.storefrontProductDetailCache = new Map<string, ProductDetailSnapshot>();
  }
  for (const rawKey of keys) {
    if (!rawKey) continue;
    const key = String(rawKey).trim();
    if (!key) continue;
    if (global.storefrontProductDetailCache.size > 300) {
      const oldestKey = global.storefrontProductDetailCache.keys().next().value;
      if (oldestKey) global.storefrontProductDetailCache.delete(oldestKey);
    }
    global.storefrontProductDetailCache.set(key, entry);
  }
}

async function fetchFreshSnapshot(): Promise<StorefrontCatalogSnapshot> {
  await connectDB();

  const sectionKeys = Object.keys(SECTION_FLAG_MAP);

  const [dbBanners, dbCategories, dbBrands, dbProducts, dbSections, dbAddons, dbReviews] = await Promise.all([
    Banner.find({
      isActive: true,
      slot: { $nin: ['duo_product_1', 'duo_product_2'] },
      category: { $ne: 'duo_showcase' },
    })
      .select('slot name title subtitle description imageUrl thumbnailUrl lifestyleUrl price originalPrice productId linkUrl sizes colors aspectRatio isActive')
      .lean(),
    Category.find({ isActive: true })
      .select('name slug targetAudience image displayOrder')
      .sort({ displayOrder: 1, name: 1 })
      .lean(),
    Brand.find({ status: { $ne: 'inactive' } })
      .select('name title slug logoUrl')
      .sort({ name: 1 })
      .lean(),
    Product.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .lean(),
    HomeSection.find({ sectionKey: { $in: sectionKeys } })
      .select('sectionKey title subtitle isActive displayOrder items')
      .lean(),
    Addon.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('_id name description price imageUrl sku stock applicableCategories displayOrder isActive')
      .lean(),
    Review.find({ status: 'approved' })
      .sort({ rating: -1, createdAt: -1 })
      .select('product customerName rating comment images videos createdAt')
      .lean(),
  ]);

  const now = Date.now();
  const catById = new Map<string, any>((dbCategories || []).map((c: any) => [String(c._id), c]));
  const brandById = new Map<string, any>((dbBrands || []).map((b: any) => [String(b._id), b]));
  const addonById = new Map<string, any>((dbAddons || []).map((a: any) => [String(a._id), a]));
  const serializedAddons = JSON.parse(JSON.stringify(dbAddons || []));
  global.storefrontAddonsCache = { addons: serializedAddons, timestamp: now };

  const reviewsByProductId = new Map<string, any[]>();
  for (const r of dbReviews || []) {
    if (!r?.product) continue;
    const pid = String(r.product);
    const list = reviewsByProductId.get(pid);
    if (list) list.push(r);
    else reviewsByProductId.set(pid, [r]);
  }

  const catNameById = new Map<string, string>(
    (dbCategories || []).map((c: any) => [String(c._id), String(c.name || '')])
  );

  const bannerMap: Record<string, any> = {};
  for (const b of dbBanners || []) {
    bannerMap[b.slot] = {
      slot: String(b.slot),
      name: String(b.name || ''),
      title: String(b.title || ''),
      subtitle: String(b.subtitle || ''),
      description: String(b.description || ''),
      imageUrl: String(b.imageUrl || ''),
      thumbnailUrl: String(b.thumbnailUrl || ''),
      lifestyleUrl: String(b.lifestyleUrl || ''),
      price: Number(b.price || 0),
      originalPrice: Number(b.originalPrice || 0),
      productId: String(b.productId || ''),
      linkUrl: String(b.linkUrl || '/products'),
      sizes: Array.isArray(b.sizes) && b.sizes.length > 0 ? b.sizes.map(String) : ['5', '6', '7', '8', '9', '10'],
      colors: Array.isArray(b.colors) ? JSON.parse(JSON.stringify(b.colors)) : [],
      aspectRatio: String(b.aspectRatio || '16/9'),
      isActive: b.isActive ?? true,
    };
  }

  const serializedProducts = (dbProducts || []).map((p: any) => {
    // Pre-populate server RAM detail cache for instant inner-page loads from storefront cards
    const pid = String(p._id);
    const formattedDetail = formatProductDetailRecord(p, catById, brandById, addonById);
    const productSpecificAddons = Array.isArray(formattedDetail.addons)
      ? formattedDetail.addons.filter((a: any) => typeof a === 'object' && a !== null && a._id && a.isActive !== false)
      : [];
    const pReviews = reviewsByProductId.get(pid) || [];
    const avgRating = pReviews.length
      ? Math.round((pReviews.reduce((s: number, r: any) => s + r.rating, 0) / pReviews.length) * 10) / 10
      : (formattedDetail.rating || 5.0);

    const detailEntry: ProductDetailSnapshot = {
      ...JSON.parse(
        JSON.stringify({
          product: formattedDetail,
          reviews: pReviews,
          avgRating,
          addons: productSpecificAddons.length > 0 ? productSpecificAddons : serializedAddons,
          hasServerData: true,
        })
      ),
      timestamp: now,
    };
    setCachedProductDetailEntry([pid, p.slug, p.seo?.slug, p.sku], detailEntry);

    const rawImgs = Array.isArray(p.images) ? p.images : [];
    const imageUrls: string[] = rawImgs
      .slice(0, 2)
      .map((img: any) => (typeof img === 'string' ? img : img?.url))
      .filter(Boolean);

    let catName = 'Footwear';
    let categoryDetails: any = null;
    const mappedCat = p.category ? catById.get(String(p.category)) : null;
    if (mappedCat) {
      catName = String(mappedCat.name);
      categoryDetails = {
        _id: String(mappedCat._id),
        name: String(mappedCat.name),
        slug: mappedCat.slug ? String(mappedCat.slug) : undefined,
        targetAudience: mappedCat.targetAudience ? String(mappedCat.targetAudience) : undefined,
      };
    } else if (p.category) {
      catName = catNameById.get(String(p.category)) || p.subCategory || 'Footwear';
    } else if (p.subCategory) {
      catName = String(p.subCategory);
    }

    const mappedBrand = p.brand ? brandById.get(String(p.brand)) : null;
    const brandName = mappedBrand
      ? String(mappedBrand.name || 'SERCHER')
      : String(p.brand || 'SERCHER');

    // Also resolve duo spotlight slots without running a second Product query
    const duoSlot =
      p.spotlightSlot === 'duo_product_1' || p.spotlightSlot === 'duo_product_2'
        ? p.spotlightSlot
        : p.featureInDuoSlot === 'duo_product_1' || p.featureInDuoSlot === 'duo_product_2'
        ? p.featureInDuoSlot
        : null;

    if (duoSlot) {
      const sm = p.spotlightMockups || {};
      const img1 = sm.mainUrl || imageUrls[0] || '';
      const img2 = sm.thumbnailUrl || imageUrls[1] || img1;
      const img3 = sm.lifestyleUrl || (typeof rawImgs[2] === 'string' ? rawImgs[2] : rawImgs[2]?.url) || img1;
      bannerMap[duoSlot] = {
        slot: duoSlot,
        name: String(p.name || ''),
        title: String(p.name || ''),
        subtitle: '',
        description: '',
        imageUrl: String(img1),
        thumbnailUrl: String(img2),
        lifestyleUrl: String(img3),
        price: Number(p.discountPrice || p.price || 0),
        originalPrice: Number(p.price || 0),
        productId: String(p._id),
        linkUrl: `/products/${p.slug || p._id}`,
        sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes.map(String) : ['5', '6', '7', '8', '9', '10'],
        colors: Array.isArray(p.colors) ? p.colors.map(String) : [],
        isActive: true,
      };
    }

    return {
      _id: String(p._id),
      name: String(p.name || ''),
      slug: p.slug ? String(p.slug) : String(p._id),
      sku: String(p.sku || ''),
      targetAudience: String(p.targetAudience || 'Men'),
      category: catName,
      categoryDetails,
      brand: brandName,
      subCategory: String(p.subCategory || ''),
      images: imageUrls.map((url) => ({ url })),
      imageUrls,
      sizes: Array.isArray(p.sizes) ? p.sizes.map(String) : [],
      sizeAvailability: Array.isArray(p.sizeAvailability)
        ? p.sizeAvailability.map((s: any) => ({ size: String(s.size), isAvailable: Boolean(s.isAvailable) }))
        : [],
      colors: Array.isArray(p.colors) ? p.colors.map(String) : [],
      colorVariants: Array.isArray(p.colorVariants)
        ? p.colorVariants.map((cv: any) => ({
            name: String(cv.name || ''),
            colorCode: cv.colorCode ? String(cv.colorCode) : undefined,
          }))
        : [],
      price: Number(p.price || 0),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
      stock: Number(p.stock ?? 0),
      isBestSeller: Boolean(p.isBestSeller),
      isTopSeller: Boolean(p.isTopSeller),
      isFeatured: Boolean(p.isFeatured),
      isLatest: Boolean(p.isLatest),
      badge: p.badge ? String(p.badge) : '',
      noReturnRefundExchange: Boolean(p.noReturnRefundExchange),
      rating: Number(p.rating ?? 5.0),
      reviewsCount: Number(p.reviewsCount ?? 0),
    };
  });

  const serializedCategories = (dbCategories || []).map((c: any) => ({
    _id: String(c._id),
    key: String(c.slug || c.name),
    name: String(c.name),
    title: String(c.name),
    slug: String(c.slug || c.name.toLowerCase().replace(/\s+/g, '-')),
    targetAudience: c.targetAudience ? String(c.targetAudience) : undefined,
    href: `/products?category=${encodeURIComponent(c.name)}`,
    imageUrl: String(c.image || '/products/placeholder.svg'),
  }));

  const serializedBrands = (dbBrands || []).map((b: any) => ({
    _id: String(b._id),
    name: String(b.name || ''),
    title: b.title ? String(b.title) : String(b.name || ''),
    slug: b.slug ? String(b.slug) : undefined,
    logoUrl: b.logoUrl ? String(b.logoUrl) : undefined,
  }));

  const dbSectionMap = new Map((dbSections || []).map((s: any) => [s.sectionKey, s]));
  const sectionsByKey: Record<string, any> = {};
  for (const key of sectionKeys) {
    const dbSection: any = dbSectionMap.get(key);
    const manualItems = Array.isArray(dbSection?.items) ? dbSection.items : [];
    const hasManualContent = manualItems.some((it: any) => it?.imageUrl);
    const items = hasManualContent
      ? JSON.parse(JSON.stringify(manualItems))
      : buildSectionItemsFromCatalog(serializedProducts, SECTION_FLAG_MAP[key], 8);
    const defaults = SECTION_DEFAULTS[key];
    sectionsByKey[key] = {
      sectionKey: key,
      title: String(dbSection?.title || defaults.title),
      subtitle: String(dbSection?.subtitle || defaults.subtitle),
      isActive: dbSection?.isActive ?? true,
      displayOrder: dbSection?.displayOrder ?? defaults.displayOrder,
      items,
    };
  }

  return {
    banners: bannerMap,
    categories: serializedCategories,
    brands: serializedBrands,
    products: serializedProducts,
    homeSections: sectionsByKey,
    timestamp: Date.now(),
  };
}

export async function getStorefrontSnapshot(): Promise<StorefrontCatalogSnapshot> {
  const now = Date.now();
  const cached = global.storefrontSnapshotCache;
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }

  if (!global.storefrontSnapshotPromise) {
    global.storefrontSnapshotPromise = fetchFreshSnapshot()
      .then((snap) => {
        global.storefrontSnapshotCache = snap;
        global.storefrontSnapshotPromise = undefined;
        return snap;
      })
      .catch((err) => {
        global.storefrontSnapshotPromise = undefined;
        if (global.storefrontSnapshotCache) {
          return global.storefrontSnapshotCache;
        }
        throw err;
      });
  }

  return global.storefrontSnapshotPromise;
}

export async function getStorefrontHomeData() {
  try {
    const snap = await getStorefrontSnapshot();
    const b = snap.banners || {};
    return {
      banners: b,
      shoeCategories: snap.categories.map((c) => ({
        id: c._id || c.slug || c.key,
        label: c.name || c.title,
        href: c.href,
        imageUrl: c.imageUrl,
      })),
      categoryCards: [
        {
          key: 'women',
          title: b.category_women?.title || 'Women',
          href: b.category_women?.linkUrl || '/category/women',
          imageUrl: b.category_women?.imageUrl || '/images/banner2.webp',
        },
        {
          key: 'men',
          title: b.category_men?.title || 'Men',
          href: b.category_men?.linkUrl || '/category/men',
          imageUrl: b.category_men?.imageUrl || '/images/banner1.webp',
        },
        {
          key: 'kids',
          title: b.category_kids?.title || 'Kids',
          href: b.category_kids?.linkUrl || '/category/kids',
          imageUrl: b.category_kids?.imageUrl || '/images/banner3.webp',
        },
      ],
      products: snap.products,
      homeSections: snap.homeSections,
      hasServerData: true,
    };
  } catch {
    return {
      banners: {},
      shoeCategories: null,
      categoryCards: null,
      products: [],
      homeSections: {},
      hasServerData: false,
    };
  }
}

export async function getStorefrontProductsData() {
  try {
    const snap = await getStorefrontSnapshot();
    return {
      products: snap.products,
      categories: snap.categories,
      brands: snap.brands,
      hasServerData: true,
    };
  } catch {
    return {
      products: [],
      categories: [],
      brands: [],
      hasServerData: false,
    };
  }
}

async function getCachedActiveAddons(): Promise<any[]> {
  const now = Date.now();
  if (global.storefrontAddonsCache && now - global.storefrontAddonsCache.timestamp < 60 * 1000) {
    return global.storefrontAddonsCache.addons;
  }
  const dbAddons = await Addon.find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 })
    .select('_id name description price imageUrl sku stock applicableCategories displayOrder isActive')
    .lean();
  const addons = JSON.parse(JSON.stringify(dbAddons || []));
  global.storefrontAddonsCache = { addons, timestamp: now };
  return addons;
}

export async function resolveFormattedProductById(id: string): Promise<any | null> {
  if (!id) return null;
  await connectDB();

  let product: any = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id).lean();
  }

  if (!product) {
    product = await Product.findOne({
      $or: [
        { slug: id },
        { 'seo.slug': id },
        { sku: id },
      ],
    }).lean();
  }

  if (!product) {
    const escapedName = id.replace(/-/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    product = await Product.findOne({
      name: new RegExp(`^${escapedName}$`, 'i'),
    }).lean();
  }

  if (!product) {
    const banner = await Banner.findOne({
      $or: [
        { slot: id },
        { linkUrl: `/products/${id}` },
        { linkUrl: id },
      ],
      category: 'duo_showcase',
    }).lean();

    if (banner) {
      const bannerImages: Array<{ url: string; alt: string }> = [];
      if (banner.imageUrl) bannerImages.push({ url: banner.imageUrl, alt: `${banner.title} - Main View` });
      if (banner.thumbnailUrl) bannerImages.push({ url: banner.thumbnailUrl, alt: `${banner.title} - Inset Angle View` });
      if (banner.lifestyleUrl) bannerImages.push({ url: banner.lifestyleUrl, alt: `${banner.title} - Lifestyle Look` });

      if (bannerImages.length === 0) {
        bannerImages.push({ url: '/products/placeholder.svg', alt: banner.title || 'Product' });
      }

      const sizeList = Array.isArray(banner.sizes) && banner.sizes.length > 0 ? banner.sizes : ['5', '6', '7', '8', '9', '10'];
      const colorList = Array.isArray(banner.colors) && banner.colors.length > 0
        ? banner.colors
        : [
            { name: 'Beige', colorCode: '#d8c7b5', imageUrl: banner.imageUrl || '/products/placeholder.svg' },
            { name: 'Cream', colorCode: '#f3ede2', imageUrl: banner.thumbnailUrl || '/products/placeholder.svg' },
            { name: 'Sand', colorCode: '#c2b29f', imageUrl: banner.lifestyleUrl || '/products/placeholder.svg' },
          ];

      product = {
        _id: banner.slot,
        name: banner.title || "Women's Casual Comfort Sandals",
        brand: 'Gravoz',
        price: banner.price || 1399,
        originalPrice: banner.originalPrice || 1429,
        rating: 5.0,
        reviewsCount: 38,
        targetAudience: banner.slot.includes('women') || (banner.title && banner.title.toLowerCase().includes('women')) ? 'Women' : 'Men',
        subCategory: 'Casual Sandals',
        stock: 45,
        sizes: sizeList,
        sizeAvailability: sizeList.map((s: string) => ({ size: s, isAvailable: true, stock: 12 })),
        colors: colorList.map((c: any) => c.name || c),
        colorVariants: colorList.map((c: any, idx: number) => ({
          name: typeof c === 'object' ? c.name : c,
          colorCode: typeof c === 'object' ? c.colorCode || '#c28b57' : '#c28b57',
          imageUrl: typeof c === 'object' && c.imageUrl ? c.imageUrl : (bannerImages[idx % bannerImages.length]?.url || '/products/placeholder.svg'),
          isAvailable: true,
        })),
        images: bannerImages,
        description: banner.description || `Experience unparalleled everyday luxury with the GRAVOZ ${banner.title || 'Casual Comfort Sandals'}. Handcrafted from premium-grade artisan materials with precision stitching.`,
        additionalInfo: {
          'Material': 'Artisan Finished Premium Leather / High-Grade Vegan Strap',
          'Sole Material': 'Ultra-Grip Anti-Skid Shock-Absorbing Rubber (TPR)',
          'Closure': 'Adjustable Ergonomic Buckle Strap',
          'Insole': 'Cushioned Orthopedic Memory Foam Footbed',
          'Country of Origin': 'India (Handcrafted)',
          'Care Instructions': 'Wipe clean with a soft dry cloth.',
        },
        shippingAndReturn: {
          'Free Delivery': 'Complimentary express shipping across India on all prepaid & COD orders.',
          'Estimated Delivery': '2 to 4 business days to metro cities; 4 to 6 days to rest of India.',
          'Easy Returns & Exchanges': '7-day hassle-free return and exchange policy with doorstep pickup.',
          'Warranty': '6-month comprehensive manufacturing warranty covering stitching & sole adhesion.',
        },
      };
    }
  }

  if (!product) return null;

  const snap = global.storefrontSnapshotCache;
  const catMap = snap ? new Map(snap.categories.map((c) => [c._id, c])) : undefined;
  const brandMap = snap ? new Map(snap.brands.map((b) => [b._id, b])) : undefined;
  const addons = await getCachedActiveAddons();
  const addonMap = new Map(addons.map((a: any) => [String(a._id), a]));

  return formatProductDetailRecord(product, catMap, brandMap, addonMap);
}

export async function getProductDetailData(id: string): Promise<Omit<ProductDetailSnapshot, 'timestamp'>> {
  try {
    if (!global.storefrontProductDetailCache) {
      global.storefrontProductDetailCache = new Map<string, ProductDetailSnapshot>();
    }

    const cleanId = decodeURIComponent(id || '').trim();
    const now = Date.now();
    const cached = global.storefrontProductDetailCache.get(cleanId) || global.storefrontProductDetailCache.get(id);
    if (cached && now - cached.timestamp < PRODUCT_DETAIL_CACHE_TTL_MS) {
      return {
        product: cached.product,
        reviews: cached.reviews,
        avgRating: cached.avgRating,
        addons: cached.addons,
        hasServerData: cached.hasServerData,
      };
    }

    const canQueryObjectIdDirect = mongoose.Types.ObjectId.isValid(cleanId);
    const [formattedProduct, directReviews, activeAddons] = await Promise.all([
      resolveFormattedProductById(cleanId),
      canQueryObjectIdDirect
        ? Review.find({ status: 'approved', product: new mongoose.Types.ObjectId(cleanId) })
            .sort({ rating: -1, createdAt: -1 })
            .lean()
        : Promise.resolve(null),
      getCachedActiveAddons(),
    ]);

    if (!formattedProduct) {
      return {
        product: null,
        reviews: [],
        avgRating: 4.8,
        addons: [],
        hasServerData: false,
      };
    }

    const productSpecificAddons = Array.isArray(formattedProduct.addons)
      ? formattedProduct.addons.filter((a: any) => typeof a === 'object' && a !== null && a._id && a.isActive !== false)
      : [];

    let reviewsRaw = directReviews;
    if (!reviewsRaw) {
      const resolvedObjectId = mongoose.Types.ObjectId.isValid(String(formattedProduct._id));
      reviewsRaw = resolvedObjectId
        ? await Review.find({ status: 'approved', product: new mongoose.Types.ObjectId(String(formattedProduct._id)) })
            .sort({ rating: -1, createdAt: -1 })
            .lean()
        : [];
    }

    const reviewsList = Array.isArray(reviewsRaw) ? reviewsRaw : [];
    const avgRating = reviewsList.length
      ? Math.round((reviewsList.reduce((s: number, r: any) => s + r.rating, 0) / reviewsList.length) * 10) / 10
      : (formattedProduct.rating || 5.0);

    const payload = JSON.parse(
      JSON.stringify({
        product: formattedProduct,
        reviews: reviewsList,
        avgRating,
        addons: productSpecificAddons.length > 0 ? productSpecificAddons : activeAddons,
        hasServerData: true,
      })
    );

    setCachedProductDetailEntry(
      [cleanId, String(formattedProduct._id), formattedProduct.slug, formattedProduct.seo?.slug, formattedProduct.sku],
      { ...payload, timestamp: now }
    );

    return payload;
  } catch {
    return {
      product: null,
      reviews: [],
      avgRating: 4.8,
      addons: [],
      hasServerData: false,
    };
  }
}

