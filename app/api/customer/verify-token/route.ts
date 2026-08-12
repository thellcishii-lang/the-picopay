import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'トークンがありません。' });
    }

    console.log('[DEBUG] 検索トークン:', token);

    // ★ 期限チェックを完全に外して、トークンだけで検索
    const customer = await prisma.customer.findFirst({
      where: {
        qrToken: {
          equals: token,
        },
      },
    });

    console.log('[DEBUG] 検索結果:', customer);

    if (!customer) {
      return NextResponse.json({
        valid: false,
        error: 'このQRコードは無効です（データベースにありません）。',
        debug: { token, found: false },
      });
    }

    return NextResponse.json({
      valid: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
      debug: { token, found: true, expiresAt: customer.qrTokenExpiresAt },
    });
  } catch (error) {
    console.error('[DEBUG] エラー:', error);
    return NextResponse.json(
      { valid: false, error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
}
