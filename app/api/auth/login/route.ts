import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です。' },
        { status: 400 }
      );
    }

    // スタッフを検索
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

    // ★ パスワード検証を一時的にスキップ（誰でもログインできる状態）
    // 本番環境では絶対に使わないでください！

    // 最終ログイン日時を更新
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() },
    });

    await createSession(staff.id);

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
