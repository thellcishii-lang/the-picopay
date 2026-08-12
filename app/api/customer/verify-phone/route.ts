import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'トークンがありません。' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { qrToken: token },
    });

    if (!customer) {
      return NextResponse.json({ error: '無効なトークンです。' }, { status: 404 });
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { phoneVerified: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('電話番号確認エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
