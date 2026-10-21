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

      // Synchronize sizeAvailability based on totalStock
      if (Array.isArray(product.sizeAvailability) && product.sizeAvailability.length > 0) {
        if (totalStock === 0) {
          product.sizeAvailability.forEach((s: any) => {
            s.isAvailable = false;
            s.stock = 0;
          });
        } else {
          const perSize = Math.max(1, Math.ceil(totalStock / product.sizeAvailability.length));
          product.sizeAvailability.forEach((s: any) => {
            s.isAvailable = true;
            s.stock = perSize;
          });
        }
        product.markModified('sizeAvailability');
      }
      product.markModified('colorVariants');

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

      // Synchronize sizeAvailability based on totalStock
      if (Array.isArray(product.sizeAvailability) && product.sizeAvailability.length > 0) {
        if (totalStock === 0) {
          product.sizeAvailability.forEach((s: any) => {
            s.isAvailable = false;
            s.stock = 0;
          });
        } else {
          const perSize = Math.max(1, Math.ceil(totalStock / product.sizeAvailability.length));
          product.sizeAvailability.forEach((s: any) => {
            s.isAvailable = true;
            s.stock = perSize;
          });
        }
        product.markModified('sizeAvailability');
      }
      product.markModified('colorVariants');

      updatedProduct = await product.save();
    } else if (newStock !== undefined && typeof newStock === 'number') {
      const product = await Product.findById(productId);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      const targetStock = Math.max(0, Math.floor(newStock));
      product.stock = targetStock;

      if (targetStock === 0) {
        if (Array.isArray(product.sizeAvailability)) {
          product.sizeAvailability.forEach((s: any) => {
            s.isAvailable = false;
            s.stock = 0;
          });
          product.markModified('sizeAvailability');
        }
        if (Array.isArray(product.colorVariants)) {
          product.colorVariants.forEach((v: any) => {
            v.isAvailable = false;
            v.stock = 0;
            if (Array.isArray(v.sizes)) {
              v.sizes.forEach((vs: any) => {
                vs.isAvailable = false;
                vs.stock = 0;
              });
            }
          });
          product.markModified('colorVariants');
        }
      } else {
        // Restock (> 0)
        if (Array.isArray(product.sizeAvailability) && product.sizeAvailability.length > 0) {
          const perSizeStock = Math.max(1, Math.ceil(targetStock / product.sizeAvailability.length));
          product.sizeAvailability.forEach((s: any) => {
            s.isAvailable = true;
            s.stock = perSizeStock;
          });
          product.markModified('sizeAvailability');
        }
        if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
          const perVariantStock = Math.max(1, Math.ceil(targetStock / product.colorVariants.length));
          product.colorVariants.forEach((v: any) => {
            v.isAvailable = true;
            v.stock = perVariantStock;
            if (Array.isArray(v.sizes) && v.sizes.length > 0) {
              const perVSizeStock = Math.max(1, Math.ceil(perVariantStock / v.sizes.length));
              v.sizes.forEach((vs: any) => {
                vs.isAvailable = true;
                vs.stock = perVSizeStock;
              });
            }
          });
          product.markModified('colorVariants');
        }
      }

      updatedProduct = await product.save();
    } else if (stockChange !== undefined && typeof stockChange === 'number') {
      const product = await Product.findById(productId);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      const targetStock = Math.max(0, (product.stock || 0) + stockChange);
      product.stock = targetStock;

      if (targetStock === 0) {
        if (Array.isArray(product.sizeAvailability)) {
          product.sizeAvailability.forEach((s: any) => {
            s.isAvailable = false;
            s.stock = 0;
          });
          product.markModified('sizeAvailability');
        }
      } else if (Array.isArray(product.sizeAvailability) && product.sizeAvailability.length > 0) {
        const perSizeStock = Math.max(1, Math.ceil(targetStock / product.sizeAvailability.length));
        product.sizeAvailability.forEach((s: any) => {
          s.isAvailable = true;
          s.stock = perSizeStock;
        });
        product.markModified('sizeAvailability');
      }

      updatedProduct = await product.save();
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
