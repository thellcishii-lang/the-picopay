import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff } from '@/lib/utils/auth';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    // リクエストボディから名前と電話番号を取得
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: '名前と電話番号は必須です。' },
        { status: 400 }
      );
    }

    // 一意のトークンを生成
    const token = `${crypto.randomUUID()}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 顧客レコードを作成（qrTokenを保存）
    const customer = await prisma.customer.create({
      data: {
        storeId: staff.storeId,
        name: name,
        phone: phone,
        qrToken: token,
        qrTokenExpiresAt: expiresAt,
      },
    });

    // QRコードに含めるURL
    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/customer/signup?token=${token}`;
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
      customer: { name, phone },
    });
  } catch (error) {
    console.error('QR発行エラー:', error);
    return NextResponse.json(
      { error: 'QRコードの生成に失敗しました' },
      { status: 500 }
    );
  }
}
