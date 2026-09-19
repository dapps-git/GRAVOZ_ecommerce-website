import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Banner } from '@/models/Banner';
import { invalidateCache } from '@/lib/redis';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectDB();
    const product: any = await Product.findById(params.id).populate('category').lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if currently assigned to any Duo Spotlight slot
    const banner = await Banner.findOne({
      $or: [
        { productId: params.id },
        { linkUrl: `/products/${product.slug}` },
      ],
      slot: { $in: ['duo_product_1', 'duo_product_2'] },
    }).lean();

    const slotValue = product.spotlightSlot && product.spotlightSlot !== 'none'
      ? product.spotlightSlot
      : (product.featureInDuoSlot || (banner ? banner.slot : ''));

    return NextResponse.json({
      ...product,
      featuredInDuoSlot: slotValue,
      spotlightSlot: slotValue,
    });
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
    const { featureInDuoSlot, spotlightSlot, ...updateData } = body;

    const chosenSlot = spotlightSlot !== undefined ? spotlightSlot : featureInDuoSlot;

    const updatePayload: any = { ...updateData };
    if (chosenSlot !== undefined) {
      updatePayload.spotlightSlot = chosenSlot === 'none' || !chosenSlot ? 'none' : chosenSlot;
      updatePayload.featureInDuoSlot = chosenSlot === 'none' || !chosenSlot ? '' : chosenSlot;
    }

    const updatedProduct: any = await Product.findByIdAndUpdate(params.id, { $set: updatePayload }, { new: true, runValidators: true });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Sync to Homepage Duo Spotlight Banner
    const mockups = updatedProduct.spotlightMockups;
    const p1 = mockups?.mainUrl || (updatedProduct.images?.[0]?.url || '');
    const p2 = mockups?.thumbnailUrl || (updatedProduct.images?.[1]?.url || p1);
    const p3 = mockups?.lifestyleUrl || (updatedProduct.images?.[2]?.url || p1);

    const activeSlot = updatePayload.spotlightSlot;

    if (activeSlot === 'duo_product_1' || activeSlot === 'duo_product_2') {
      // Clear this slot from any other product to avoid collision
      await Product.updateMany(
        { _id: { $ne: updatedProduct._id }, spotlightSlot: activeSlot },
        { $set: { spotlightSlot: 'none', featureInDuoSlot: '' } }
      );

      await Banner.findOneAndUpdate(
        { slot: activeSlot },
        {
          $set: {
            productId: updatedProduct._id.toString(),
            title: updatedProduct.name,
            price: updatedProduct.discountPrice || updatedProduct.price,
            originalPrice: updatedProduct.price,
            linkUrl: `/products/${updatedProduct.slug || updatedProduct._id}`,
            imageUrl: p1,
            thumbnailUrl: p2,
            lifestyleUrl: p3,
            sizes: updatedProduct.sizes || ['6', '7', '8', '9', '10', '11'],
            isActive: true,
          },
        },
        { upsert: true }
      );
    } else if (activeSlot === 'none') {
      await Banner.updateMany(
        { productId: params.id, slot: { $in: ['duo_product_1', 'duo_product_2'] } },
        { $set: { productId: '' } }
      );
    } else {
      // Auto-sync any existing banner that features this product
      await Banner.updateMany(
        {
          $or: [
            { productId: params.id },
            { linkUrl: `/products/${updatedProduct.slug}` },
          ],
          slot: { $in: ['duo_product_1', 'duo_product_2'] },
        },
        {
          $set: {
            title: updatedProduct.name,
            price: updatedProduct.discountPrice || updatedProduct.price,
            originalPrice: updatedProduct.price,
            linkUrl: `/products/${updatedProduct.slug || updatedProduct._id}`,
            imageUrl: p1,
            thumbnailUrl: p2,
            lifestyleUrl: p3,
            sizes: updatedProduct.sizes,
          },
        }
      );
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
