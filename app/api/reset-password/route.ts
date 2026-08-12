import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils/auth';

// GETでもPOSTでも同じ処理をする
export async function GET() {
  return await handleReset();
}

export async function POST() {
  return await handleReset();
}

async function handleReset() {
  try {
    const hashed = await hashPassword('password123');

    await prisma.staff.update({
      where: { email: 'owner@example.com' },
      data: { password: hashed },
    });

    return NextResponse.json({
      success: true,
      message: 'パスワードを password123 にリセットしました',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
