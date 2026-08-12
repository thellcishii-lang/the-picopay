import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'トークンがありません。' });
    }

    // 1. 入力されたトークンで検索
    const customer = await prisma.customer.findFirst({
      where: { qrToken: token },
    });

    if (customer) {
      return NextResponse.json({
        valid: true,
        customer: { id: customer.id, name: customer.name, phone: customer.phone },
        debug: { match: true, dbToken: customer.qrToken },
      });
    }

    // 2. 見つからない場合、DB内の最近のトークンを取得して比較
    const recentCustomers = await prisma.customer.findMany({
      where: { qrToken: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { name: true, qrToken: true, createdAt: true },
    });

    return NextResponse.json({
      valid: false,
      error: 'このQRコードは無効です（データベースにありません）。',
      debug: {
        inputToken: token,
        inputTokenLength: token.length,
        recentTokensInDb: recentCustomers.map(c => ({
          name: c.name,
          token: c.qrToken,
          tokenLength: c.qrToken?.length,
        })),
      },
    });
  } catch (error) {
    console.error('トークン検証エラー:', error);
    return NextResponse.json(
      { valid: false, error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
}
