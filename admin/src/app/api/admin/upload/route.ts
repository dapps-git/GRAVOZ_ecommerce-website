import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    // Try Cloudinary upload first if configured
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        const result = await new Promise<{
          secure_url: string;
          public_id: string;
          format: string;
          width: number;
          height: number;
        }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: folder,
              format: 'webp',
              fetch_format: 'webp',
              quality: 'auto:good',
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
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local file storage:', cloudErr);
      }
    }

    // Local file storage fallback
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const ext = file.name.split('.').pop() || 'webp';
    const cleanFileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, cleanFileName);

    await writeFile(filePath, buffer);
    const localUrl = `/uploads/${cleanFileName}`;

    return NextResponse.json({
      success: true,
      url: localUrl,
      publicId: cleanFileName,
      format: ext,
      alt: altText,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('File upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Image upload failed' },
      { status: 500 }
    );
  }
}
