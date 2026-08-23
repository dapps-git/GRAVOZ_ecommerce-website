import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { invalidateCache } from '@/lib/redis';

// PUT /api/stock (Atomic stock adjustment)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { productId, stockChange, newStock } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    let updatedProduct;

    if (newStock !== undefined && typeof newStock === 'number') {
      // Set absolute stock value
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: { stock: Math.max(0, newStock) } },
        { new: true }
      );
    } else if (stockChange !== undefined && typeof stockChange === 'number') {
      // Atomic increment/decrement (Rule 17)
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: stockChange } },
        { new: true }
      );
    } else {
      return NextResponse.json({ error: 'Provide either stockChange or newStock' }, { status: 400 });
    }

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await invalidateCache('admin:dashboard:stats');

    return NextResponse.json({
      success: true,
      productId: updatedProduct._id,
      name: updatedProduct.name,
      stock: updatedProduct.stock,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Stock update failed' }, { status: 500 });
  }
}
