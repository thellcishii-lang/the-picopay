import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentStaff } from '@/lib/utils/auth';

// 保護するルート
const protectedRoutes = ['/staff', '/api/staff', '/api/roles'];
const authRoutes = ['/login', '/'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // APIルートの場合
  if (path.startsWith('/api')) {
    // 認証不要なAPIは除外
    const publicApis = ['/api/auth/login'];
    if (publicApis.some((api) => path.startsWith(api))) {
      return NextResponse.next();
    }

    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ページルートの場合
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthPage = authRoutes.some((route) => path === route || path.startsWith(route + '/'));

  const staff = await getCurrentStaff();

  // 認証が必要なページに未認証でアクセス → ログインページへ
  if (isProtected && !staff) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 認証済みでログインページにアクセス → ダッシュボードへ
  if (isAuthPage && staff && path !== '/') {
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
