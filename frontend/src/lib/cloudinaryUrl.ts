/**
 * Rewrites Cloudinary URLs to request appropriately sized, auto-formatted WebP/AVIF
 * directly from Cloudinary's edge CDN, avoiding local Next.js _next/image proxy hops.
 */
export function optimizeCloudinaryUrl(src?: string | null, width = 600): string {
  if (!src || typeof src !== 'string') return '/products/placeholder.svg';
  const trimmed = src.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '/products/placeholder.svg';

  const marker = '/image/upload/';
  if (!trimmed.includes('res.cloudinary.com') || !trimmed.includes(marker)) {
    return trimmed;
  }

  const idx = trimmed.indexOf(marker);
  const afterUpload = trimmed.slice(idx + marker.length);

  // Preserve URLs that already have explicit Cloudinary transforms
  const firstSegment = afterUpload.split('/')[0] || '';
  if (firstSegment && !/^v\d+$/.test(firstSegment) && /(f_|q_|w_|c_|ar_)/.test(firstSegment)) {
    return trimmed;
  }

  const clampedWidth = Math.max(120, Math.min(width, 1600));
  return `${trimmed.slice(0, idx + marker.length)}f_auto,q_auto:good,w_${clampedWidth},c_limit/${afterUpload}`;
}

export function isDirectCdnUrl(src?: string | null): boolean {
  if (!src || typeof src !== 'string') return false;
  return src.includes('res.cloudinary.com') || src.startsWith('data:') || src.endsWith('.svg');
}

