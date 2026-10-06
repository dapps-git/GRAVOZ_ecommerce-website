import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const JWT_SECRET = process.env.JWT_SECRET || 'gravoz_ecommerce_super_secure_jwt_secret_key_2026_xyz!';
const secretKey = new TextEncoder().encode(JWT_SECRET);

async function verifyToken(token: string | undefined): Promise<any | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get('gravoz_user_token')?.value;
  const refreshToken = request.cookies.get('gravoz_user_refresh_token')?.value;

  // Cryptographically verify JWT token
  let session = await verifyToken(accessToken);
  if (!session && refreshToken) {
    session = await verifyToken(refreshToken);
  }

  const isUserAuthenticated = Boolean(session && session.userId);

  // 1. Protected Customer Pages (Requires Cryptographically Valid Authentication)
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

    // Clear any invalid or forged cookies
    if (accessToken || refreshToken) {
      response.cookies.delete('gravoz_user_token');
      response.cookies.delete('gravoz_user_refresh_token');
    }
    return response;
  }

  // 2. Auth Pages (Redirect to /profile or callbackUrl if already authenticated)
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/register';

  if (isAuthPage && isUserAuthenticated) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl && callbackUrl.startsWith('/')) {
      return NextResponse.redirect(new URL(decodeURIComponent(callbackUrl), request.url));
    }
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // 3. Protected Customer APIs (Requires Cryptographically Valid Authentication)
  const isProtectedApi =
    pathname.startsWith('/api/referrals/status') ||
    pathname.startsWith('/api/auth/update-password');

  if (isProtectedApi && !isUserAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized. Cryptographically valid customer session required.' },
      { status: 401 }
    );
  }

  // 4. Attach authenticated user details to request headers for downstream routes
  const requestHeaders = new Headers(request.headers);
  if (session?.userId) {
    requestHeaders.set('x-user-id', String(session.userId));
  }
  if (session?.email) {
    requestHeaders.set('x-user-email', String(session.email));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/account/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
    '/checkout/:path*',
    '/api/referrals/status',
    '/api/auth/update-password',
    '/login',
    '/signup',
    '/register',
  ],
};
