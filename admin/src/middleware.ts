import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const JWT_SECRET = process.env.JWT_SECRET || 'gravoz_ecommerce_super_secure_jwt_secret_key_2026_xyz!';
const secretKey = new TextEncoder().encode(JWT_SECRET);

async function verifyAdminToken(token: string | undefined): Promise<any | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('gravoz_admin_token')?.value;
  const refreshToken = request.cookies.get('gravoz_admin_refresh_token')?.value;

  // Cryptographically verify Admin JWT token
  let session = await verifyAdminToken(accessToken);
  if (!session && refreshToken) {
    session = await verifyAdminToken(refreshToken);
  }

  const isAdminAuthenticated = Boolean(session && (session.adminId || session.role === 'admin' || session.role === 'superadmin'));

  // 1. Protect Admin UI Routes (e.g. /admin/dashboard, /admin/products)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!isAdminAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));
      const response = NextResponse.redirect(loginUrl);

      // Clear invalid cookies
      if (accessToken || refreshToken) {
        response.cookies.delete('gravoz_admin_token');
        response.cookies.delete('gravoz_admin_refresh_token');
      }
      return response;
    }
  }

  // 2. Redirect logged-in admin away from /admin/login
  if (pathname === '/admin/login') {
    if (isAdminAuthenticated) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // 3. Protect Admin API Routes (e.g. /api/products, /api/coupons, /api/orders, /api/customers)
  // Public exceptions: /api/admin/auth/login and /api/health
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/admin/auth/login') &&
    !pathname.startsWith('/api/health')
  ) {
    if (!isAdminAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Cryptographically valid admin session required.' },
        { status: 401 }
      );
    }
  }

  // Attach verified admin headers to downstream requests
  const requestHeaders = new Headers(request.headers);
  if (session?.adminId) {
    requestHeaders.set('x-admin-id', String(session.adminId));
  }
  if (session?.email) {
    requestHeaders.set('x-admin-email', String(session.email));
  }
  if (session?.role) {
    requestHeaders.set('x-admin-role', String(session.role));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
