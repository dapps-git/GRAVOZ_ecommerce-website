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

  const rawSrc = src && typeof src === 'string' ? src.trim() : '';
  const isInvalid = hasError || !rawSrc || rawSrc === 'undefined' || rawSrc === 'null';
  const cleanSrc = isInvalid ? '/products/placeholder.svg' : rawSrc;
  const isUnoptimized = cleanSrc.startsWith('data:') || cleanSrc.endsWith('.svg') || cleanSrc.startsWith('http://') || cleanSrc.startsWith('https://');

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

