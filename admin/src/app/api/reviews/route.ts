import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';

// GET /api/reviews?productId=xxx
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    const filter: Record<string, any> = {};
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      filter.product = new mongoose.Types.ObjectId(productId);
    }

    const reviews = await Review.find(filter)
      .populate('product', 'name sku primaryImage thumbnail slug')
      .sort({ rating: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews (Admin add review)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { productId, customerName, customerEmail, rating, comment, isVerifiedPurchase, status } = body;

    if (!productId || !customerName || !customerEmail || !rating) {
      return NextResponse.json({ error: 'Product, customer name, email, and rating are required' }, { status: 400 });
    }

    const review = await Review.create({
      product: new mongoose.Types.ObjectId(productId),
      customerName,
      customerEmail: customerEmail.toLowerCase().trim(),
      rating: Number(rating),
      comment: comment || '',
      isVerifiedPurchase: isVerifiedPurchase ?? true,
      status: status || 'approved',
      images: body.images || [],
      videos: body.videos || [],
    });

    // Update product rating
    try {
      const allReviews = await Review.find({ product: productId, status: 'approved' });
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / (allReviews.length || 1);
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(avg * 10) / 10,
        reviewsCount: allReviews.length,
      });
    } catch (err) {
      console.warn('Product rating update err:', err);
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: error.message || 'Failed to create review' }, { status: 500 });
  }
}

// PUT /api/reviews (Admin update review status)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, status, rating, comment } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (rating !== undefined) updateData.rating = Number(rating);
    if (comment !== undefined) updateData.comment = comment;

    const updated = await Review.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Recalculate product rating
    if (updated.product) {
      try {
        const allReviews = await Review.find({ product: updated.product, status: 'approved' });
        const avg = allReviews.length ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;
        await Product.findByIdAndUpdate(updated.product, {
          rating: Math.round(avg * 10) / 10,
          reviewsCount: allReviews.length,
        });
      } catch (err) {
        console.warn('Product rating update err:', err);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: error.message || 'Failed to update review' }, { status: 500 });
  }
}

// DELETE /api/reviews?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const deleted = await Review.findByIdAndDelete(id);
    if (deleted && deleted.product) {
      try {
        const allReviews = await Review.find({ product: deleted.product, status: 'approved' });
        const avg = allReviews.length ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;
        await Product.findByIdAndUpdate(deleted.product, {
          rating: Math.round(avg * 10) / 10,
          reviewsCount: allReviews.length,
        });
      } catch (err) {
        console.warn('Product rating update err:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete review' }, { status: 500 });
  }
}
