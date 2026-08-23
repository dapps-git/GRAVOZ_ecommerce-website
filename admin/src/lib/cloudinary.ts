import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'gravoz-demo',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gravoz_cloudinary_secret_key_demo',
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
