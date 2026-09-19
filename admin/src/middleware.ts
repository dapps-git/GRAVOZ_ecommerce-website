import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminToken =
    request.cookies.get('gravoz_admin_token')?.value ||
    request.cookies.get('gravoz_admin_refresh_token')?.value;

  // 1. Protect Admin UI Routes (e.g. /admin/dashboard, /admin/products)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Redirect logged-in admin away from /admin/login
  if (pathname === '/admin/login') {
    if (adminToken) {
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
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
