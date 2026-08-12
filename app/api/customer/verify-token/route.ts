import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'トークンがありません。' });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        qrToken: token,
        qrTokenExpiresAt: {
          gt: new Date(), // 有効期限内
        },
      },
    });

    if (!customer) {
      return NextResponse.json({
        valid: false,
        error: 'このQRコードは無効か期限切れです。',
      });
    }

    return NextResponse.json({
      valid: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
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
