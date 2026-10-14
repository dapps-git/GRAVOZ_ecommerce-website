import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'gravoz_ecommerce_super_secure_jwt_secret_key_2026_xyz!';
const secretKey = new TextEncoder().encode(JWT_SECRET);

const USER_TOKEN_COOKIE = process.env.USER_TOKEN_COOKIE_NAME || 'gravoz_user_token';
const USER_REFRESH_TOKEN_COOKIE = process.env.USER_REFRESH_TOKEN_COOKIE_NAME || 'gravoz_user_refresh_token';

async function verifyToken(token: string | undefined): Promise<any | null> {
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
  const { pathname, search } = request.nextUrl;

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;

  const accessToken =
    request.cookies.get(USER_TOKEN_COOKIE)?.value ||
    request.cookies.get('gravoz_user_token')?.value ||
    bearerToken;

  const refreshToken =
    request.cookies.get(USER_REFRESH_TOKEN_COOKIE)?.value ||
    request.cookies.get('gravoz_user_refresh_token')?.value;

  // Cryptographically verify JWT token
  let session = await verifyToken(accessToken);
  if (!session && refreshToken) {
    session = await verifyToken(refreshToken);
  }

  const isUserAuthenticated = Boolean(session && session.userId);

  // 1. Protected Customer Pages (Requires Valid Customer Session)
  const isProtectedPage =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/checkout');

  if (isProtectedPage && !isUserAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(`${pathname}${search}`));
    const response = NextResponse.redirect(loginUrl);

    // Clear invalid cookies
    response.cookies.delete(USER_TOKEN_COOKIE);
    response.cookies.delete(USER_REFRESH_TOKEN_COOKIE);
    response.cookies.delete('gravoz_user_token');
    response.cookies.delete('gravoz_user_refresh_token');

    return applySecurityHeaders(response);
  }

  // 2. Auth Pages (Redirect to /profile or callbackUrl if already authenticated)
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

  if (isAuthPage && isUserAuthenticated) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl && callbackUrl.startsWith('/')) {
      const response = NextResponse.redirect(new URL(decodeURIComponent(callbackUrl), request.url));
      return applySecurityHeaders(response);
    }
    const response = NextResponse.redirect(new URL('/profile', request.url));
    return applySecurityHeaders(response);
  }

  // 3. Protected Customer APIs (Requires Valid Customer Session)
  const isProtectedApi =
    pathname.startsWith('/api/referrals/status') ||
    pathname.startsWith('/api/referrals/withdraw') ||
    pathname.startsWith('/api/auth/update-password') ||
    pathname.startsWith('/api/auth/profile');

  if (isProtectedApi && !isUserAuthenticated) {
    const response = NextResponse.json(
      { error: 'Unauthorized. Cryptographically valid customer session required.' },
      { status: 401 }
    );
    return applySecurityHeaders(response);
  }

  // 4. Protect customer order history retrieval
  if (pathname === '/api/orders' && request.method === 'GET' && !isUserAuthenticated) {
    const response = NextResponse.json(
      { error: 'Unauthorized. Please log in to view order history.' },
      { status: 401 }
    );
    return applySecurityHeaders(response);
  }

  // 5. Attach authenticated user details to request headers for downstream routes
  const requestHeaders = new Headers(request.headers);
  if (session?.userId) {
    requestHeaders.set('x-user-id', String(session.userId));
  }
  if (session?.email) {
    requestHeaders.set('x-user-email', String(session.email));
  }
  if (session?.role) {
    requestHeaders.set('x-user-role', String(session.role));
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/account/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
    '/checkout/:path*',
    '/api/referrals/:path*',
    '/api/auth/update-password',
    '/api/auth/profile',
    '/api/orders',
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
  ],
};
