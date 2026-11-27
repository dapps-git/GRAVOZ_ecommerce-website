import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Brand } from '@/models/Brand';

let cachedBrandsResponse: any = null;
let lastBrandsCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(_req: NextRequest) {
  try {
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    };
    const now = Date.now();
    if (cachedBrandsResponse && now - lastBrandsCacheTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedBrandsResponse, { headers: cacheHeaders });
    }

    await connectDB();
    const brands = await Brand.find({ status: { $ne: 'inactive' } })
      .select('name title slug logoUrl')
      .sort({ name: 1 })
      .lean();
    const result = { success: true, brands };
    cachedBrandsResponse = result;
    lastBrandsCacheTime = now;
    return NextResponse.json(result, { headers: cacheHeaders });
  } catch (error: any) {
    console.error('Fetch brands error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch brands', brands: [] }, { status: 500 });
  }
}
