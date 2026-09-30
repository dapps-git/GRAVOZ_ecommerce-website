import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ valid: true, items: [] });
    }

    const errors: string[] = [];
    const stockDetails: Array<{
      productId: string;
      size?: string;
      color?: string;
      availableStock: number;
      requestedQuantity: number;
      isOutOfStock: boolean;
      message?: string;
    }> = [];

    for (const item of items) {
      const productId = item.productId || item.id || item._id;
      const requestedQty = Number(item.quantity) || 1;
      const itemSize = String(item.size || '').trim();
      const itemColor = String(item.color || '').trim();

      let product: any = null;
      if (mongoose.Types.ObjectId.isValid(productId)) {
        product = await Product.findById(productId).lean();
      }
      if (!product && typeof productId === 'string') {
        product = await Product.findOne({
          $or: [{ slug: productId }, { sku: productId }, { name: productId }],
        }).lean();
      }

      if (!product) {
        errors.push(`Product "${item.title || 'Item'}" is no longer available in store.`);
        stockDetails.push({
          productId,
          size: itemSize,
          color: itemColor,
          availableStock: 0,
          requestedQuantity: requestedQty,
          isOutOfStock: true,
          message: 'Product not found or removed.',
        });
        continue;
      }

      if (product.status !== 'active') {
        errors.push(`"${product.name}" is currently unavailable.`);
        stockDetails.push({
          productId,
          size: itemSize,
          color: itemColor,
          availableStock: 0,
          requestedQuantity: requestedQty,
          isOutOfStock: true,
          message: 'Product is currently inactive.',
        });
        continue;
      }

      // Check size-specific stock if available
      let availableStock = Number(product.stock) || 0;
      let sizeFound = false;

      if (itemSize && Array.isArray(product.sizeAvailability) && product.sizeAvailability.length > 0) {
        const sizeObj = product.sizeAvailability.find((s: any) => String(s.size).trim() === itemSize);
        if (sizeObj) {
          sizeFound = true;
          if (sizeObj.isAvailable === false || (sizeObj.stock !== undefined && sizeObj.stock <= 0)) {
            availableStock = 0;
          } else if (sizeObj.stock !== undefined) {
            availableStock = Math.min(availableStock, sizeObj.stock);
          }
        }
      }

      // Check color variant stock if available
      if (itemColor && Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
        const variantObj = product.colorVariants.find(
          (v: any) => String(v.name).trim().toLowerCase() === itemColor.toLowerCase()
        );
        if (variantObj) {
          if (variantObj.isAvailable === false) {
            availableStock = 0;
          }
          if (itemSize && Array.isArray(variantObj.sizes) && variantObj.sizes.length > 0) {
            const vSizeObj = variantObj.sizes.find((s: any) => String(s.size).trim() === itemSize);
            if (vSizeObj) {
              if (vSizeObj.isAvailable === false || (vSizeObj.stock !== undefined && vSizeObj.stock <= 0)) {
                availableStock = 0;
              } else if (vSizeObj.stock !== undefined) {
                availableStock = Math.min(availableStock, vSizeObj.stock);
              }
            }
          }
        }
      }

      const isOutOfStock = availableStock <= 0;
      const isInsufficient = availableStock > 0 && requestedQty > availableStock;

      if (isOutOfStock) {
        const msg = `"${product.name}" ${itemSize ? `(Size: ${itemSize})` : ''} is currently Out of Stock.`;
        errors.push(msg);
        stockDetails.push({
          productId,
          size: itemSize,
          color: itemColor,
          availableStock: 0,
          requestedQuantity: requestedQty,
          isOutOfStock: true,
          message: msg,
        });
      } else if (isInsufficient) {
        const msg = `Only ${availableStock} pair(s) available for "${product.name}" ${itemSize ? `(Size: ${itemSize})` : ''}. You requested ${requestedQty}.`;
        errors.push(msg);
        stockDetails.push({
          productId,
          size: itemSize,
          color: itemColor,
          availableStock,
          requestedQuantity: requestedQty,
          isOutOfStock: false,
          message: msg,
        });
      } else {
        stockDetails.push({
          productId,
          size: itemSize,
          color: itemColor,
          availableStock,
          requestedQuantity: requestedQty,
          isOutOfStock: false,
        });
      }
    }

    const isValid = errors.length === 0;

    return NextResponse.json({
      valid: isValid,
      success: isValid,
      errors,
      stockDetails,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Cart stock validation error:', err);
    return NextResponse.json({ error: err.message || 'Stock validation failed' }, { status: 500 });
  }
}
