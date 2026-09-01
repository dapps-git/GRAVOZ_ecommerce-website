/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Image Optimization & Caching ──────────────────────────────────────────
  images: {
    // Cache optimized images for 1 year (31536000s) in the browser
    minimumCacheTTL: 31536000,
    // Enable modern formats — browser picks best format automatically
    formats: ['image/webp', 'image/avif'],
    // Accept images from Cloudinary & localhost
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
    // Device sizes for responsive images
    deviceSizes: [375, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ── Aggressive HTTP Cache Headers for Static Assets ──────────────────────
  async headers() {
    return [
      // Public product images — 1 year browser cache + CDN cache
      {
        source: '/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400, immutable',
          },
        ],
      },
      // Icons — 1 year cache
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400, immutable',
          },
        ],
      },
      // Banners / marketing images — 1 week cache (may update more often)
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // API routes — no cache by default, Next.js handles per-route
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
          // Security headers for API
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Security headers on all pages
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // ── Performance Optimizations ─────────────────────────────────────────────
  compress: true,
  poweredByHeader: false,

  // ── Experimental Features ─────────────────────────────────────────────────
  experimental: {
    // Optimize CSS loading
    optimizeCss: false,
  },
};

module.exports = nextConfig;
