import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff } from '@/lib/utils/auth';
import QRCode from 'qrcode';

export async function POST() {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    // 一意のトークンを生成（簡易的にUUID＋タイムスタンプ）
    const token = `${crypto.randomUUID()}-${Date.now()}`;

    // 有効期限を設定（例：24時間後）
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 仮顧客レコードを作成（本登録はSMS認証後）
    const customer = await prisma.customer.create({
      data: {
        storeId: staff.storeId,
        name: '仮登録', // 仮の名前
        qrToken: token,
        qrTokenExpiresAt: expiresAt,
      },
    });

    // QRコードに含めるURL
    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/customer/signup?token=${token}`;

    // QRコードを画像データ（DataURL）として生成
    const qrImage = await QRCode.toDataURL(signupUrl, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({
      success: true,
      qrImage,
      token,
      customerId: customer.id,
      expiresAt,
      signupUrl,
    });
  } catch (error) {
    console.error('QR発行エラー:', error);
    return NextResponse.json(
      { error: 'QRコードの生成に失敗しました' },
      { status: 500 }
    );
  }
}
