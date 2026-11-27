import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Returns optimized Cloudinary image URL with q_auto, f_auto, and responsive width (Rules 4, 7)
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options: { width?: number; height?: number; crop?: string } = {}
): string {
  if (!publicIdOrUrl) return '/placeholder-shoe.png';

  if (!publicIdOrUrl.includes('cloudinary.com')) {
    return publicIdOrUrl; // If already external URL or fallback
  }

  const { width = 800, height, crop = 'limit' } = options;

  // Insert transformations (f_auto, q_auto, w_X)
  const transformationStr = `f_auto,q_auto,w_${width}${height ? `,h_${height},c_${crop}` : ''}`;
  return publicIdOrUrl.replace('/upload/', `/upload/${transformationStr}/`);
}

/**
 * Generates thumbnail poster image for videos (Rule 6)
 */
export function getVideoPosterUrl(videoUrl: string): string {
  if (!videoUrl) return '';
  return videoUrl.replace(/\.[^/.]+$/, '.jpg').replace('/upload/', '/upload/f_auto,q_auto,so_0/');
}

const urlUploadCache = new Map<string, string>();

/**
 * Takes any image URL (Google Drive, external CDN, etc.).
 * If it is not already hosted on Cloudinary:
 * - Detects Google Drive links and resolves the direct image thumbnail/stream
 * - Downloads the buffer and uploads it to Cloudinary in auto webp format
 * - Returns the permanent Cloudinary secure_url (https://res.cloudinary.com/...)
 */
export async function uploadUrlToCloudinary(
  rawUrl: string,
  folder: string = 'gravoz/products'
): Promise<string> {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '/products/placeholder.svg' || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Already hosted on Cloudinary
  if (trimmed.includes('cloudinary.com')) {
    return trimmed;
  }

  // Check cache to avoid duplicate uploads
  if (urlUploadCache.has(trimmed)) {
    return urlUploadCache.get(trimmed)!;
  }

  // Ensure Cloudinary credentials are set
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return trimmed;
  }

  try {
    const isDrive =
      trimmed.includes('drive.google.com') ||
      trimmed.includes('drive.usercontent.google.com') ||
      trimmed.includes('googleusercontent.com');

    let fetchUrl = trimmed;
    if (isDrive) {
      const match = trimmed.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
      if (match && match[1]) {
        fetchUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`;
      }
    }

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

      const uploadResult = await cloudinary.uploader.upload(base64Data, {
        folder,
        format: 'webp',
        fetch_format: 'webp',
        quality: 'auto:good',
        transformation: [
          { width: 1400, height: 1400, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' }
        ],
      });

      urlUploadCache.set(trimmed, uploadResult.secure_url);
      return uploadResult.secure_url;
    } else {
      // Direct upload attempt via Cloudinary URL fetch
      const uploadResult = await cloudinary.uploader.upload(trimmed, {
        folder,
        format: 'webp',
        fetch_format: 'webp',
        quality: 'auto:good',
        transformation: [
          { width: 1400, height: 1400, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' }
        ],
      });
      urlUploadCache.set(trimmed, uploadResult.secure_url);
      return uploadResult.secure_url;
    }
  } catch (err: any) {
    console.warn(`[Cloudinary Auto-Upload] Warning for ${trimmed}:`, err?.message);
    return trimmed;
  }
}

/**
 * Normalizes product colorVariants[].images so Mongoose [ProductImageSchema]
 * always receives valid { url, alt } subdocuments and never raw or empty strings.
 */
export async function normalizeColorVariantsImages(
  colorVariants: any[],
  fallbackAlt: string = 'Product'
): Promise<any[]> {
  return Promise.all(
    colorVariants.map(async (v: any) => {
      const rawImgs = Array.isArray(v?.images) ? v.images : [];
      const vImages: Array<{ url: string; alt: string; publicId?: string }> = [];

      for (const img of rawImgs) {
        const rawUrl = typeof img === 'string' ? img : img?.url;
        if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) continue;
        const cUrl = await uploadUrlToCloudinary(rawUrl);
        if (!cUrl || !cUrl.trim()) continue;
        vImages.push({
          url: cUrl.trim(),
          alt:
            typeof img === 'object' && img?.alt
              ? String(img.alt)
              : `${fallbackAlt} ${v?.name || ''} photo`.trim(),
          ...(typeof img === 'object' && img?.publicId ? { publicId: String(img.publicId) } : {}),
        });
      }

      const fallbackImgUrl =
        vImages[0]?.url ||
        (v?.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim()
          ? await uploadUrlToCloudinary(v.imageUrl)
          : '');

      return {
        ...v,
        imageUrl: fallbackImgUrl || '',
        images: vImages,
      };
    })
  );
}
