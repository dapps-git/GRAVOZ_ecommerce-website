import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { invalidateCache } from '@/lib/redis';

// PUT /api/stock (Atomic stock adjustment)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { productId, stockChange, newStock, variantName, variantIsAvailable, variantStock, colorVariants } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    let updatedProduct: any;

    if (colorVariants && Array.isArray(colorVariants)) {
      // Direct update of colorVariants array
      const product = await Product.findById(productId);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      product.colorVariants = colorVariants;
      // Re-sum total stock from available variants
      const totalStock = colorVariants.reduce((sum: number, v: any) => {
        if (v.isAvailable === false) return sum;
        return sum + (v.stock !== undefined ? Number(v.stock) : 10);
      }, 0);
      product.stock = totalStock;
      updatedProduct = await product.save();
    } else if (variantName) {
      // Toggle / edit a single variant by name
      const product = await Product.findById(productId);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      const variants = product.colorVariants || [];
      const vIndex = variants.findIndex(
        (v: any) => String(v.name).toLowerCase() === String(variantName).toLowerCase()
      );

      if (vIndex >= 0) {
        if (variantIsAvailable !== undefined) variants[vIndex].isAvailable = Boolean(variantIsAvailable);
        if (variantStock !== undefined) variants[vIndex].stock = Math.max(0, Number(variantStock));
      } else {
        variants.push({
          name: variantName,
          colorCode: '#000000',
          isAvailable: variantIsAvailable !== undefined ? Boolean(variantIsAvailable) : true,
          stock: variantStock !== undefined ? Math.max(0, Number(variantStock)) : 10,
        });
      }

      product.colorVariants = variants;
      // Recalculate stock
      const totalStock = variants.reduce((sum: number, v: any) => {
        if (v.isAvailable === false) return sum;
        return sum + (v.stock !== undefined ? Number(v.stock) : 10);
      }, 0);
      product.stock = totalStock;
      updatedProduct = await product.save();
    } else if (newStock !== undefined && typeof newStock === 'number') {
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
      return NextResponse.json({ error: 'Provide stockChange, newStock, or variant updates' }, { status: 400 });
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
