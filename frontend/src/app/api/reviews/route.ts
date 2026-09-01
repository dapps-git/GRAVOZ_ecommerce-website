import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';

// GET /api/reviews?productId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    await connectDB();

    let query: Record<string, any> = { status: 'approved' };
    if (mongoose.Types.ObjectId.isValid(productId)) {
      query.product = new mongoose.Types.ObjectId(productId);
    }

    const reviews = await Review.find(query).sort({ createdAt: -1 }).lean();

    const avgRating = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 5.0;

    return NextResponse.json({ success: true, reviews, avgRating, count: reviews.length });
  } catch (err: any) {
    console.error('Fetch reviews error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews (Submit review)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      productId,
      orderId,
      customerName,
      customerEmail,
      rating,
      comment,
      images,
      videos,
    } = body;

    if (!customerEmail || !rating) {
      return NextResponse.json({ error: 'customerEmail and rating are required' }, { status: 400 });
    }

    let validProductId = null;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      validProductId = new mongoose.Types.ObjectId(productId);
    } else {
      // Find product by slug or sku
      const p = await Product.findOne({
        $or: [{ _id: productId }, { slug: productId }, { sku: productId }],
      });
      if (p) validProductId = p._id;
    }

    if (!validProductId) {
      // fallback to first active product
      const firstP = await Product.findOne({ status: 'active' });
      if (firstP) validProductId = firstP._id;
    }

    // Check duplicate review
    if (validProductId) {
      const existing = await Review.findOne({
        product: validProductId,
        customerEmail: customerEmail.toLowerCase().trim(),
      });
      if (existing) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 409 }
        );
      }
    }

    const validOrderId =
      orderId && mongoose.Types.ObjectId.isValid(orderId)
        ? new mongoose.Types.ObjectId(orderId)
        : null;

    const newReview = await Review.create({
      product: validProductId,
      orderId: validOrderId,
      customerName: customerName || 'Verified Customer',
      customerEmail: customerEmail.toLowerCase().trim(),
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment || '',
      images: images || [],
      videos: videos || [],
      isVerifiedPurchase: !!validOrderId,
      status: 'approved',
    });

    // Recalculate product rating
    if (validProductId) {
      try {
        const allReviews = await Review.find({ product: validProductId, status: 'approved' });
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        await Product.findByIdAndUpdate(validProductId, {
          rating: Math.round(avg * 10) / 10,
          reviewsCount: allReviews.length,
        });
      } catch (e) {
        console.warn('Product rating update warning:', e);
      }
    }

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (err: any) {
    console.error('Submit review error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 });
  }
}
