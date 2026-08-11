// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Node.js ランタイムを強制指定（Edge を無効化）
export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = 'picopay_session';

const protectedRoutes = ['/staff', '/api/staff', '/api/roles', '/api/customers', '/api/balance', '/api/transactions'];
const authRoutes = ['/login', '/'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie;

  if (path.startsWith('/api')) {
    const publicApis = ['/api/auth/login'];
    if (publicApis.some((api) => path.startsWith(api))) {
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthPage = authRoutes.some((route) => path === route || path.startsWith(route + '/'));

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && isAuthenticated && path !== '/') {
    return NextResponse.redirect(new URL('/staff/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/staff/:path*',
    '/login',
    '/',
  ],
};
