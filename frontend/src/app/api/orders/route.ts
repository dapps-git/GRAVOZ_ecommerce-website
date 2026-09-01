import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Customer } from '@/models/Customer';
import { Cart } from '@/models/Cart';
import { Product } from '@/models/Product';

// GET /api/orders?email=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const customerId = searchParams.get('customerId');

    if (!email && !customerId) {
      return NextResponse.json({ error: 'email or customerId required' }, { status: 400 });
    }

    await connectDB();

    const query: Record<string, any> = {};
    if (email) {
      query.customerEmail = email.toLowerCase().trim();
    } else if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      query.customerId = customerId;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error('Fetch orders error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders (Place Order)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      discountAmount,
      couponCode,
      shippingFee,
      totalAmount,
      paymentMethod,
    } = body;

    if (!customerEmail || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 });
    }

    // Generate unique human-readable order number
    const orderNumber =
      'GRV-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);

    // Estimated delivery (5 days out)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const paymentStatus = paymentMethod === 'COD' ? 'pending' : 'paid';

    const cleanCustomerId =
      customerId && typeof customerId === 'string' && mongoose.Types.ObjectId.isValid(customerId)
        ? customerId
        : '';

    const newOrder = await Order.create({
      orderNumber,
      customerId: cleanCustomerId,
      customerEmail: customerEmail.toLowerCase().trim(),
      customerName: customerName || 'Customer',
      customerPhone: customerPhone || shippingAddress.phone || '',
      shippingAddress,
      items,
      subtotal: Number(subtotal) || 0,
      discountAmount: Number(discountAmount) || 0,
      couponCode: couponCode || '',
      shippingFee: Number(shippingFee) || 0,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus,
      orderStatus: 'ordered',
      estimatedDelivery,
      statusHistory: [
        {
          status: 'ordered',
          timestamp: new Date(),
          note: `Order placed via ${paymentMethod || 'COD'}`,
        },
      ],
    });

    // Update customer stats & activity
    try {
      const customerQuery = cleanCustomerId
        ? { _id: cleanCustomerId }
        : { email: customerEmail.toLowerCase().trim() };

      await Customer.findOneAndUpdate(customerQuery, {
        $inc: { totalOrders: 1, totalSpent: Number(totalAmount) || 0 },
        $push: {
          activityLogs: {
            action: 'Order Placed',
            details: `Order #${orderNumber} for ₹${totalAmount}`,
            timestamp: new Date(),
          },
        },
      });
    } catch (e) {
      console.warn('Customer stats update warning:', e);
    }

    // Attempt to clear cart for this user
    try {
      const guestIdCookie = req.cookies.get('gravoz_guest_id')?.value;
      if (guestIdCookie) {
        await Cart.deleteOne({ guestId: guestIdCookie });
      }
      if (cleanCustomerId) {
        await Cart.deleteOne({ userId: cleanCustomerId });
      }
    } catch (e) {
      console.warn('Cart clear warning:', e);
    }

    // Atomic product stock decrement
    try {
      for (const itm of items) {
        if (itm.productId && mongoose.Types.ObjectId.isValid(itm.productId)) {
          await Product.findByIdAndUpdate(itm.productId, {
            $inc: { stock: -Number(itm.quantity || 1) },
          });
        }
      }
    } catch (e) {
      console.warn('Stock decrement warning:', e);
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
