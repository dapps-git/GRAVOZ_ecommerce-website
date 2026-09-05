import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Brand } from '@/models/Brand';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const brands = await Brand.find({ status: { $ne: 'inactive' } }).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, brands });
  } catch (error: any) {
    console.error('Fetch brands error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch brands', brands: [] }, { status: 500 });
  }
}
