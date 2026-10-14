import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

const ADMIN_TOKEN_COOKIE = process.env.ADMIN_TOKEN_COOKIE_NAME || 'gravoz_admin_token';
const ADMIN_REFRESH_TOKEN_COOKIE = process.env.ADMIN_REFRESH_TOKEN_COOKIE_NAME || 'gravoz_admin_refresh_token';

async function verifyAdminToken(token: string | undefined): Promise<any | null> {
  if (!token || !token.trim()) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;

  const accessToken =
    request.cookies.get(ADMIN_TOKEN_COOKIE)?.value ||
    request.cookies.get('gravoz_admin_token')?.value ||
    bearerToken;

  const refreshToken =
    request.cookies.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value ||
    request.cookies.get('gravoz_admin_refresh_token')?.value;

  // Cryptographically verify Admin JWT token
  let session = await verifyAdminToken(accessToken);
  if (!session && refreshToken) {
    session = await verifyAdminToken(refreshToken);
  }

  const isAdminAuthenticated = Boolean(
    session && (session.adminId || session.role === 'admin' || session.role === 'superadmin')
  );

  // 1. Protect Admin UI Routes (e.g. /admin/dashboard, /admin/orders, /admin/products)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!isAdminAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));
      const response = NextResponse.redirect(loginUrl);

      // Clear invalid cookies
      response.cookies.delete(ADMIN_TOKEN_COOKIE);
      response.cookies.delete(ADMIN_REFRESH_TOKEN_COOKIE);
      response.cookies.delete('gravoz_admin_token');
      response.cookies.delete('gravoz_admin_refresh_token');

      return applySecurityHeaders(response);
    }
  }

  // 2. Redirect logged-in admin away from /admin/login to dashboard
  if (pathname === '/admin/login') {
    if (isAdminAuthenticated) {
      const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
      return applySecurityHeaders(response);
    }
  }

  // 3. Protect Admin API Routes (e.g. /api/products, /api/orders, /api/coupons, /api/customers)
  // Public exceptions: /api/admin/auth/* (login, logout, refresh, me) and /api/health
  const isAuthOrHealth =
    pathname.startsWith('/api/admin/auth/') ||
    pathname.startsWith('/api/health');

  if (pathname.startsWith('/api/') && !isAuthOrHealth) {
    if (!isAdminAuthenticated) {
      const response = NextResponse.json(
        { error: 'Unauthorized. Cryptographically valid admin session required.' },
        { status: 401 }
      );
      return applySecurityHeaders(response);
    }
  }

  // 4. Attach verified admin headers to downstream requests
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

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
