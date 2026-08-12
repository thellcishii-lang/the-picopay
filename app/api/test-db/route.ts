import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. 環境変数の存在確認（値は表示しない）
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    // 2. データベース接続テスト
    const result = await prisma.$queryRaw`SELECT 1 as connected, NOW() as time, current_database() as db_name`;

    return NextResponse.json({
      success: true,
      message: 'データベース接続成功！',
      env: envCheck,
      data: result,
    });
  } catch (error: any) {
    // 3. エラーの詳細を全て返す
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
