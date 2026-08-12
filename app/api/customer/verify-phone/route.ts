// app/api/customer/verify-phone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'トークンがありません。' }, { status: 400 });
    }

    // 顧客を検索
    const customer = await prisma.customer.findFirst({
      where: { qrToken: token },
    });

    if (!customer) {
      return NextResponse.json({ error: '無効なトークンです。' }, { status: 404 });
    }

    // 電話番号確認済みフラグを立てる（カラムがなければ追加）
    // ここでは仮に `phoneVerified` カラムがある前提で更新
    // 必要なら Prisma スキーマに追加
    await prisma.customer.update({
      where: { id: customer.id },
      data: { phoneVerified: true },
    });

    // 顧客セッションを作成（任意）
    // ここではリダイレクト先で顧客情報を取得できるようにトークンを返す
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('電話番号確認エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
