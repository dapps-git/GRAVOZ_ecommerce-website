'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function normalizeImageUrl(src?: string | null): string {
  if (!src || typeof src !== 'string') return '/products/placeholder.svg';
  const trimmed = src.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '/products/placeholder.svg';

  // Automatically convert Google Drive links to reliable fast CDN URLs
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('drive.usercontent.google.com') ||
    trimmed.includes('googleusercontent.com')
  ) {
    const idMatch = trimmed.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}=s1000`;
    }
  }

  return trimmed;
}

export default function ProductImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes,
  priority = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  const normalized = normalizeImageUrl(src);
  const isInvalid = hasError || !normalized || normalized === '/products/placeholder.svg';
  const cleanSrc = isInvalid ? '/products/placeholder.svg' : normalized;
  const isUnoptimized =
    cleanSrc.startsWith('data:') ||
    cleanSrc.endsWith('.svg') ||
    cleanSrc.startsWith('http://') ||
    cleanSrc.startsWith('https://');

  return (
    <Image
      src={cleanSrc}
      alt={alt || 'Product'}
      width={!fill ? (width || 64) : undefined}
      height={!fill ? (height || 64) : undefined}
      fill={fill}
      sizes={sizes}
      priority={priority}
      unoptimized={isUnoptimized}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

