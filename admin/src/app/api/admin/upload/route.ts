import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const altText = (formData.get('alt') as string) || 'Product photo';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary with WebP/AVIF auto formatting (Rule 4)
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'gravoz/products',
          format: 'webp',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      alt: altText,
    });
  } catch (error: unknown) {
    const err = error as Error;
    // Fallback handler if Cloudinary upload fails or environment key missing: provide demo URL
    return NextResponse.json(
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
        publicId: 'demo_fallback',
        alt: 'Fallback Shoe Photo',
        warning: err.message,
      },
      { status: 200 }
    );
  }
}
