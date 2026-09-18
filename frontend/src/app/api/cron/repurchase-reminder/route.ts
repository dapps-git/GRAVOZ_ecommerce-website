import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { sendRepurchaseEmail, generateRepurchaseEmailHtml } from '@/lib/email/repurchaseEmail';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleRepurchase(req);
}

export async function POST(req: NextRequest) {
  return handleRepurchase(req);
}

async function handleRepurchase(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const testEmail = searchParams.get('testEmail') || searchParams.get('email');
    const emailType = (searchParams.get('type') === '4_months' ? '4_months' : '3_months') as '3_months' | '4_months';
    const format = searchParams.get('format'); // 'html' or 'json'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gravoz-ecommerce-website.vercel.app';

    // ── 1. TEST MODE: Send demo email to a specific address ─────────────────────
    if (testEmail) {
      let sampleProduct = await Product.findOne({ status: 'active' }).lean();
      if (!sampleProduct) {
        sampleProduct = await Product.findOne().lean();
      }

      const productName = sampleProduct?.name || 'GRAVOZ Pure Leather Casual Shoe';
      const productPrice = sampleProduct?.discountPrice || sampleProduct?.price || 1399;
      const productImage = sampleProduct?.images?.[0]?.url || 
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800';
      const productId = sampleProduct?.slug || sampleProduct?._id || 'sample';
      const productUrl = `${appUrl}/products/${productId}?ref=repurchase_${emailType}`;

      const daysAgo = emailType === '4_months' ? 120 : 90;
      const payload = {
        toEmail: testEmail.trim(),
        customerName: 'Aifas',
        productName,
        productImage,
        productPrice,
        productSize: '8 UK',
        productColor: 'Brown Leather',
        productUrl,
        type: emailType,
        appUrl,
        purchaseDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      };

      if (format === 'html') {
        const html = generateRepurchaseEmailHtml(payload);
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      const result = await sendRepurchaseEmail(payload);

      return NextResponse.json({
        success: result.success,
        type: emailType,
        message: result.message,
        recipient: testEmail,
        product: {
          name: productName,
          price: productPrice,
          image: productImage,
          link: productUrl,
        },
        smtpConfigured: !!(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD),
        previewUrl: `${appUrl}/api/cron/repurchase-reminder?testEmail=${encodeURIComponent(testEmail)}&type=${emailType}&format=html`,
      });
    }

    // ── 2. AUTOMATED BATCH MODE: Scan 3-Month and 4-Month Orders ────────────────
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // A. 3-Month Window (75 to 105 days ago)
    const threeMonthStart = new Date(now - 105 * dayMs);
    const threeMonthEnd = new Date(now - 75 * dayMs);

    const eligible3MonthOrders = await Order.find({
      createdAt: { $gte: threeMonthStart, $lte: threeMonthEnd },
      threeMonthEmailSent: { $ne: true },
      repurchaseEmailSent: { $ne: true }, // backwards compat
      customerEmail: { $exists: true, $ne: '' },
    }).limit(30);

    let sent3MonthCount = 0;
    for (const order of eligible3MonthOrders) {
      const primaryItem = order.items?.[0];
      if (!primaryItem) continue;

      const productUrl = `${appUrl}/products/${primaryItem.productId}?ref=repurchase_3m`;
      const purchaseDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const res = await sendRepurchaseEmail({
        toEmail: order.customerEmail,
        customerName: order.customerName || 'Valued Customer',
        productName: primaryItem.name,
        productImage: primaryItem.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
        productPrice: primaryItem.price,
        productSize: primaryItem.size,
        productColor: primaryItem.color,
        productUrl,
        orderNumber: order.orderNumber,
        purchaseDate,
        type: '3_months',
        appUrl,
      });

      if (res.success) {
        order.threeMonthEmailSent = true;
        order.threeMonthEmailSentAt = new Date();
        order.repurchaseEmailSent = true; // backwards compat
        await order.save();
        sent3MonthCount++;
      }
    }

    // B. 4-Month Window (106 to 140 days ago)
    const fourMonthStart = new Date(now - 140 * dayMs);
    const fourMonthEnd = new Date(now - 106 * dayMs);

    const eligible4MonthOrders = await Order.find({
      createdAt: { $gte: fourMonthStart, $lte: fourMonthEnd },
      fourMonthEmailSent: { $ne: true },
      customerEmail: { $exists: true, $ne: '' },
    }).limit(30);

    let sent4MonthCount = 0;
    for (const order of eligible4MonthOrders) {
      const primaryItem = order.items?.[0];
      if (!primaryItem) continue;

      const productUrl = `${appUrl}/products/${primaryItem.productId}?ref=repurchase_4m`;
      const purchaseDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const res = await sendRepurchaseEmail({
        toEmail: order.customerEmail,
        customerName: order.customerName || 'Valued Customer',
        productName: primaryItem.name,
        productImage: primaryItem.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
        productPrice: primaryItem.price,
        productSize: primaryItem.size,
        productColor: primaryItem.color,
        productUrl,
        orderNumber: order.orderNumber,
        purchaseDate,
        type: '4_months',
        appUrl,
      });

      if (res.success) {
        order.fourMonthEmailSent = true;
        order.fourMonthEmailSentAt = new Date();
        await order.save();
        sent4MonthCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        threeMonthEmails: {
          scanned: eligible3MonthOrders.length,
          sent: sent3MonthCount,
        },
        fourMonthEmails: {
          scanned: eligible4MonthOrders.length,
          sent: sent4MonthCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Repurchase reminder cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
