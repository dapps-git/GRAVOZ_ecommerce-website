'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureAttributionFromUrl } from '@/lib/affiliateAttribution';

export default function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      captureAttributionFromUrl(searchParams);
    }
  }, [searchParams]);

  return null;
}

