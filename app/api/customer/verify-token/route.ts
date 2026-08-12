import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'トークンがありません。' });
    }

    console.log('[verify-token] 検索するトークン:', token);

    // ★ 期限切れのチェックを一旦外して、トークンだけで検索
    const customer = await prisma.customer.findFirst({
      where: {
        qrToken: token,
      },
    });

    console.log('[verify-token] 検索結果:', customer);

    if (!customer) {
      return NextResponse.json({
        valid: false,
        error: 'このQRコードは無効です。',
        debug: { token, found: false },
      });
    }

    // ★ 期限チェック（有効期限が設定されていて、かつ現在時刻より後なら有効）
    const isValid = customer.qrTokenExpiresAt
      ? new Date(customer.qrTokenExpiresAt) > new Date()
      : true;

    if (!isValid) {
      return NextResponse.json({
        valid: false,
        error: 'このQRコードは期限切れです。',
        debug: { token, expiresAt: customer.qrTokenExpiresAt, now: new Date() },
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
    console.error('[verify-token] エラー:', error);
    return NextResponse.json(
      { valid: false, error: 'サーバーエラーが発生しました。', debug: { error: String(error) } },
      { status: 500 }
    );
  }
}
