/**
 * Client-side image compression utility to prevent HTTP 413 (Payload Too Large)
 * and speed up uploads significantly by optimizing raw photos in the browser.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetMime?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    targetMime = 'image/webp',
  } = options;

  // Don't compress non-image files or SVG/GIF
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  // If the file is already tiny (less than 300KB), keep as is unless format conversion requested
  if (file.size < 300 * 1024 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio downscaling
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          return resolve(file);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            const ext = targetMime === 'image/webp' ? 'webp' : 'jpg';
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}.${ext}`, {
              type: targetMime,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          targetMime,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
