import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Wishlist, IWishlistItem } from '@/models/Wishlist';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get('guestId') || req.cookies.get('gravoz_guest_id')?.value;

    if (!guestId) {
      return NextResponse.json({ success: true, items: [], count: 0 });
    }

    try {
      await connectDB();
      const wishlist = await Wishlist.findOne({ guestId }).lean();
      const items: IWishlistItem[] = wishlist?.items || [];

      return NextResponse.json({
        success: true,
        items,
        count: items.length,
      });
    } catch {
      return NextResponse.json({ success: true, items: [], count: 0 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, item } = body;

    if (!item?.productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const effectiveGuestId = guestId || 'guest_' + Math.random().toString(36).substring(2, 12);

    try {
      await connectDB();
      let wishlist = await Wishlist.findOne({ guestId: effectiveGuestId });

      if (!wishlist) {
        wishlist = new Wishlist({
          guestId: effectiveGuestId,
          items: [
            {
              productId: item.productId,
              title: item.title,
              price: Number(item.price),
              originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
              imageUrl: item.imageUrl || '/products/product1.webp',
              size: item.size,
              color: item.color,
            },
          ],
        });
      } else {
        const existingIdx = wishlist.items.findIndex((i) => i.productId === item.productId);

        if (existingIdx > -1) {
          // Toggle out if already in wishlist
          wishlist.items.splice(existingIdx, 1);
        } else {
          wishlist.items.push({
            productId: item.productId,
            title: item.title,
            price: Number(item.price),
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            imageUrl: item.imageUrl || '/products/product1.webp',
            size: item.size,
            color: item.color,
          });
        }
      }

      await wishlist.save();

      const response = NextResponse.json({
        success: true,
        items: wishlist.items,
        count: wishlist.items.length,
        guestId: effectiveGuestId,
      });

      response.cookies.set('gravoz_guest_id', effectiveGuestId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return response;
    } catch {
      return NextResponse.json({
        success: true,
        items: [item],
        count: 1,
        guestId: effectiveGuestId,
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get('guestId') || req.cookies.get('gravoz_guest_id')?.value;
    const productId = searchParams.get('productId');
    const clearAll = searchParams.get('clearAll') === 'true';

    try {
      await connectDB();
      const wishlist = await Wishlist.findOne({ guestId });
      if (!wishlist) {
        return NextResponse.json({ success: true, items: [], count: 0 });
      }

      if (clearAll) {
        wishlist.items = [];
      } else if (productId) {
        wishlist.items = wishlist.items.filter((i) => i.productId !== productId);
      }

      await wishlist.save();

      return NextResponse.json({
        success: true,
        items: wishlist.items,
        count: wishlist.items.length,
      });
    } catch {
      return NextResponse.json({ success: true, items: [], count: 0 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
