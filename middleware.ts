import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// セッションクッキー名（auth.ts と合わせる）
const SESSION_COOKIE_NAME = 'picopay_session';

// 保護するルート
const protectedRoutes = ['/staff', '/api/staff', '/api/roles', '/api/customers', '/api/balance', '/api/transactions'];
const authRoutes = ['/login', '/'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // セッションクッキーの有無で認証状態を判断（DBにはアクセスしない）
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie;

  // APIルートの場合
  if (path.startsWith('/api')) {
    // 認証不要なAPIは除外
    const publicApis = ['/api/auth/login'];
    if (publicApis.some((api) => path.startsWith(api))) {
      return NextResponse.next();
    }

    // 認証が必要なAPI
    if (!isAuthenticated) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ページルートの場合
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthPage = authRoutes.some((route) => path === route || path.startsWith(route + '/'));

  // 認証が必要なページに未認証でアクセス → ログインページへ
  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 認証済みでログインページにアクセス → ダッシュボードへ
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
