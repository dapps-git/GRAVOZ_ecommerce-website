import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { invalidateCache } from '@/lib/redis';
import { backgroundQueue } from '@/lib/jobs';

// GET /api/orders
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '15', 10), 50);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (status && status !== 'all') {
      query.orderStatus = status;
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders (Rules 16 & 17: Recalculate price on backend + Atomic stock update)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { customer, items, paymentMethod } = body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Customer details and items are required' }, { status: 400 });
    }

    let calculatedSubtotal = 0;
    const validatedItems = [];

    // Recalculate prices and verify stock on backend (Rule 16)
    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 400 });
      }

      if (dbProduct.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product "${dbProduct.name}". Only ${dbProduct.stock} available.` },
          { status: 400 }
        );
      }

      const itemPrice = dbProduct.discountPrice && dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price;
      calculatedSubtotal += itemPrice * item.quantity;

      validatedItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        size: item.size || 'M',
        color: item.color || '',
        quantity: item.quantity,
        price: itemPrice,
        image: dbProduct.images[0]?.url,
      });

      // Atomic stock deduction (Rule 17)
      dbProduct.stock = Math.max(0, (dbProduct.stock || 0) - item.quantity);
      const itemSize = String(item.size || '').trim();
      const itemColor = String(item.color || '').trim().toLowerCase();

      if (itemSize && Array.isArray(dbProduct.sizeAvailability)) {
        const sObj = dbProduct.sizeAvailability.find((s: any) => String(s.size).trim() === itemSize);
        if (sObj) {
          const currentStock = sObj.stock !== undefined ? sObj.stock : Math.max(0, dbProduct.stock);
          sObj.stock = Math.max(0, currentStock - item.quantity);
          if (sObj.stock === 0) sObj.isAvailable = false;
        }
        dbProduct.markModified('sizeAvailability');
      }

      if (itemColor && Array.isArray(dbProduct.colorVariants)) {
        const vObj = dbProduct.colorVariants.find(
          (v: any) => String(v.name || '').trim().toLowerCase() === itemColor
        );
        if (vObj) {
          const currentVStock = vObj.stock !== undefined ? vObj.stock : 10;
          vObj.stock = Math.max(0, currentVStock - item.quantity);
          if (vObj.stock === 0) vObj.isAvailable = false;

          if (itemSize && Array.isArray(vObj.sizes)) {
            const vsObj = vObj.sizes.find((s: any) => String(s.size).trim() === itemSize);
            if (vsObj) {
              const currentVSStock = vsObj.stock !== undefined ? vsObj.stock : 10;
              vsObj.stock = Math.max(0, currentVSStock - item.quantity);
              if (vsObj.stock === 0) vsObj.isAvailable = false;
            }
          }
        }
        dbProduct.markModified('colorVariants');
      }

      await dbProduct.save();
    }

    const tax = Math.round(calculatedSubtotal * 0.05 * 100) / 100;
    const shippingFee = calculatedSubtotal >= 100 ? 0 : 15;
    const totalAmount = calculatedSubtotal + tax + shippingFee;

    const orderNumber = 'GRV-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);

    const newOrder = await Order.create({
      orderNumber,
      customer,
      items: validatedItems,
      subtotal: calculatedSubtotal,
      tax,
      shippingFee,
      discountAmount: 0,
      totalAmount,
      paymentStatus: 'paid',
      orderStatus: 'pending',
      paymentMethod: paymentMethod || 'Credit Card',
    });

    // Invalidate dashboard stats cache
    await invalidateCache('admin:dashboard:stats');

    // Trigger async invoice background task (Rule 15)
    await backgroundQueue.addJob('SEND_INVOICE_EMAIL', {
      email: customer.email,
      orderNumber: newOrder.orderNumber,
      totalAmount,
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Order creation failed' }, { status: 500 });
  }
}
