import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です。' },
        { status: 400 }
      );
    }

    // スタッフを検索（ロールも含めて取得）
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません。' },
        { status: 401 }
      );
    }

    // パスワード検証
    const isValid = await verifyPassword(password, staff.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません。' },
        { status: 401 }
      );
    }

    // 最終ログイン日時を更新
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() },
    });

    // セッション作成
    await createSession(staff.id);

    // パスワードを除外して返却
    const { password: _, ...staffWithoutPassword } = staff;

    return NextResponse.json({
      success: true,
      staff: staffWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
