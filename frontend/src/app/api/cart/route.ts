import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Cart, ICartItem } from '@/models/Cart';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get('guestId') || req.cookies.get('gravoz_guest_id')?.value;

    if (!guestId) {
      return NextResponse.json({ success: true, items: [], subtotal: 0, count: 0 });
    }

    try {
      await connectDB();
      const cart = await Cart.findOne({ guestId }).lean();
      const items: ICartItem[] = cart?.items || [];
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const count = items.reduce((sum, item) => sum + item.quantity, 0);

      return NextResponse.json({
        success: true,
        items,
        subtotal,
        count,
      });
    } catch {
      return NextResponse.json({ success: true, items: [], subtotal: 0, count: 0 });
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

    if (!item?.productId || !item?.size) {
      return NextResponse.json({ error: 'Product ID and size are required' }, { status: 400 });
    }

    const effectiveGuestId = guestId || 'guest_' + Math.random().toString(36).substring(2, 12);

    try {
      await connectDB();
      let cart = await Cart.findOne({ guestId: effectiveGuestId });

      if (!cart) {
        cart = new Cart({
          guestId: effectiveGuestId,
          items: [
            {
              productId: item.productId,
              title: item.title,
              price: Number(item.price),
              originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
              size: item.size,
              quantity: Number(item.quantity) || 1,
              imageUrl: item.imageUrl || '/products/placeholder.svg',
              color: item.color,
            },
          ],
        });
      } else {
        const existingIdx = cart.items.findIndex(
          (i) => i.productId === item.productId && i.size === item.size
        );

        if (existingIdx > -1) {
          cart.items[existingIdx].quantity += Number(item.quantity) || 1;
        } else {
          cart.items.push({
            productId: item.productId,
            title: item.title,
            price: Number(item.price),
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            size: item.size,
            quantity: Number(item.quantity) || 1,
            imageUrl: item.imageUrl || '/products/placeholder.svg',
            color: item.color,
          });
        }
      }

      await cart.save();

      const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

      const response = NextResponse.json({
        success: true,
        items: cart.items,
        subtotal,
        count,
        guestId: effectiveGuestId,
      });

      response.cookies.set('gravoz_guest_id', effectiveGuestId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return response;
    } catch {
      // In offline mode return payload back with success
      return NextResponse.json({
        success: true,
        items: [item],
        subtotal: item.price * (item.quantity || 1),
        count: item.quantity || 1,
        guestId: effectiveGuestId,
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, productId, size, quantity } = body;

    if (!productId || !size) {
      return NextResponse.json({ error: 'Missing productId or size' }, { status: 400 });
    }

    try {
      await connectDB();
      const cart = await Cart.findOne({ guestId });
      if (!cart) {
        return NextResponse.json({ success: true, items: [], subtotal: 0, count: 0 });
      }

      const idx = cart.items.findIndex(
        (i) => i.productId === productId && i.size === size
      );

      if (idx > -1) {
        if (quantity <= 0) {
          cart.items.splice(idx, 1);
        } else {
          cart.items[idx].quantity = quantity;
        }
        await cart.save();
      }

      const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

      return NextResponse.json({
        success: true,
        items: cart.items,
        subtotal,
        count,
      });
    } catch {
      return NextResponse.json({ success: true, items: [], subtotal: 0, count: 0 });
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
    const size = searchParams.get('size');
    const clearAll = searchParams.get('clearAll') === 'true';

    try {
      await connectDB();
      const cart = await Cart.findOne({ guestId });
      if (!cart) {
        return NextResponse.json({ success: true, items: [], subtotal: 0, count: 0 });
      }

      if (clearAll) {
        cart.items = [];
      } else if (productId && size) {
        cart.items = cart.items.filter(
          (i) => !(i.productId === productId && i.size === size)
        );
      }

      await cart.save();

      const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

      return NextResponse.json({
        success: true,
        items: cart.items,
        subtotal,
        count,
      });
    } catch {
      return NextResponse.json({ success: true, items: [], subtotal: 0, count: 0 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
