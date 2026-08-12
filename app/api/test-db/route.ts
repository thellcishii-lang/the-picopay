import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 単純なクエリ（$queryRaw は使わない）
    const staffCount = await prisma.staff.count();
    
    return NextResponse.json({
      success: true,
      message: 'データベース接続成功！',
      staffCount,
    });
  } catch (error: any) {
    console.error('DB接続エラー:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
