import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'gravoz/products';
    const altText = (formData.get('alt') as string) || 'GRAVOZ Footwear';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary with mandatory WebP formatting and auto-optimization
    const result = await new Promise<{ secure_url: string; public_id: string; format: string; width: number; height: number }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          format: 'webp',
          fetch_format: 'webp',
          quality: 'auto:good',
          transformation: [
            { format: 'webp', quality: 'auto:good' }
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format || 'webp',
      width: result.width,
      height: result.height,
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
