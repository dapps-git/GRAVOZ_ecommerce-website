import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Brand from '@/models/Brand';

export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find({}).sort({ name: 1 });
    return NextResponse.json(brands);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, logoUrl, description, status, seo } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brand = await Brand.create({
      name,
      slug,
      logoUrl: logoUrl || '',
      description: description || '',
      status: status || 'active',
      seo: seo || { metaTitle: name, metaDescription: description, keywords: [name], slug },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, name, logoUrl, description, status, seo } = body;

    const updated = await Brand.findByIdAndUpdate(
      id,
      { name, logoUrl, description, status, seo },
      { new: true }
    );
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });

    await Brand.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
