import { NextRequest, NextResponse } from 'next/server';
import { getProductDetailData } from '@/lib/storefront-data';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const detail = await getProductDetailData(id);
    if (!detail.product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        product: detail.product,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to fetch product by id:', error);
    return NextResponse.json({ error: error.message || 'Failed to load product' }, { status: 500 });
  }
}
