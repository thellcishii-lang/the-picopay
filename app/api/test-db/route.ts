import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 環境変数の存在確認
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    // ★ モデルを使ったクエリに変更（$queryRaw は使わない）
    const staffCount = await prisma.staff.count();
    const storeCount = await prisma.store.count();

    return NextResponse.json({
      success: true,
      message: 'データベース接続成功！',
      env: envCheck,
      data: {
        staffCount,
        storeCount,
        tablesExist: { staff: staffCount >= 0, store: storeCount >= 0 },
      },
    });
  } catch (error: any) {
    console.error('DB接続エラー詳細:', error);
    return NextResponse.json({
      success: false,
      message: 'データベース接続失敗',
      env: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
      },
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
    }, { status: 500 });
  }
}
