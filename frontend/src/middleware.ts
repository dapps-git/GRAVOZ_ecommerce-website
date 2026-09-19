import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const userToken =
    request.cookies.get('gravoz_user_token')?.value ||
    request.cookies.get('gravoz_user_refresh_token')?.value;

  // 1. Protected Customer Pages (Requires Authentication)
  const isProtectedPage =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/wishlist');

  if (isProtectedPage && !userToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(`${pathname}${search}`));
    return NextResponse.redirect(loginUrl);
  }

  // 2. Auth Pages (Redirect to /profile if already logged in)
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/register';

  if (isAuthPage && userToken) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl && callbackUrl.startsWith('/')) {
      return NextResponse.redirect(new URL(decodeURIComponent(callbackUrl), request.url));
    }
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/account/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
    '/login',
    '/signup',
    '/register',
  ],
};
