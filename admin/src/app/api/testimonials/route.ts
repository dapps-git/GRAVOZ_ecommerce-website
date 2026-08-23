import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Testimonial } from '@/models/Testimonial';

// GET /api/testimonials
export async function GET() {
  try {
    await connectDB();
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(testimonials);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST /api/testimonials
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { customerName, roleOrLocation, rating, comment, isApproved } = body;

    const newTestimonial = await Testimonial.create({
      customerName,
      roleOrLocation: roleOrLocation || 'Shoe Enthusiast',
      rating: rating || 5,
      comment,
      isApproved: isApproved !== undefined ? isApproved : true,
    });

    return NextResponse.json({ success: true, testimonial: newTestimonial }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create testimonial' }, { status: 500 });
  }
}

// PUT /api/testimonials (Toggle approve)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, isApproved } = body;

    const updated = await Testimonial.findByIdAndUpdate(id, { $set: { isApproved } }, { new: true });
    return NextResponse.json({ success: true, testimonial: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update testimonial' }, { status: 500 });
  }
}
