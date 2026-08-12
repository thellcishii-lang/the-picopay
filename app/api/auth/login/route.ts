import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  // ★ リクエスト受信ログ
  console.log('[LOGIN] Request received');

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[LOGIN] Email:', email);
    console.log('[LOGIN] Password length:', password?.length || 0);

    // バリデーション
    if (!email || !password) {
      console.log('[LOGIN] Validation failed: missing fields');
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です。' },
        { status: 400 }
      );
    }

    // ★ Prisma接続テスト
    console.log('[LOGIN] Testing database connection...');
    try {
      const testResult = await prisma.$queryRaw`SELECT 1 as connected`;
      console.log('[LOGIN] Database connection test:', testResult);
    } catch (dbError) {
      console.error('[LOGIN] Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'データベース接続に失敗しました。' },
        { status: 500 }
      );
    }

    // スタッフを検索
    console.log('[LOGIN] Searching for staff:', email);
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!staff) {
      console.log('[LOGIN] Staff not found:', email);
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません。' },
        { status: 401 }
      );
    }

    console.log('[LOGIN] Staff found, verifying password...');

    // パスワード検証
    const isValid = await verifyPassword(password, staff.password);
    if (!isValid) {
      console.log('[LOGIN] Password invalid for:', email);
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません。' },
        { status: 401 }
      );
    }

    console.log('[LOGIN] Password valid, creating session...');

    // 最終ログイン日時を更新
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() },
    });

    // セッション作成
    await createSession(staff.id);

    const { password: _, ...staffWithoutPassword } = staff;

    console.log('[LOGIN] Login successful for:', email);
    return NextResponse.json({
      success: true,
      staff: staffWithoutPassword,
    });
  } catch (error) {
    // ★ 詳細なエラーログ
    console.error('[LOGIN] Unhandled error:', error);
    if (error instanceof Error) {
      console.error('[LOGIN] Error name:', error.name);
      console.error('[LOGIN] Error message:', error.message);
      console.error('[LOGIN] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
