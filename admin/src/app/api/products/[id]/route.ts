import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { invalidateCache } from '@/lib/redis';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();
    const product = await Product.findById(params.id).populate('category').lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();
    const body = await req.json();

    // No hard image upper limit — each color variant can have up to 5 images

    const updatedProduct = await Product.findByIdAndUpdate(params.id, { $set: body }, { new: true, runValidators: true });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await invalidateCache('admin:dashboard:stats');
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();
    const deleted = await Product.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await invalidateCache('admin:dashboard:stats');
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
  }
}
