import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff, hasPermission } from '@/lib/utils/auth';

// ロール一覧取得
export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  // 権限チェック
  if (!await hasPermission('manageRoles')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const roles = await prisma.role.findMany({
    where: { storeId: staff.storeId },
    include: {
      _count: { select: { staff: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ roles });
}

// 新規ロール作成
export async function POST(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('manageRoles')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const body = await request.json();
  const { name, permissions } = body;

  if (!name || !permissions) {
    return NextResponse.json(
      { error: 'ロール名と権限設定は必須です。' },
      { status: 400 }
    );
  }

  const role = await prisma.role.create({
    data: {
      name,
      storeId: staff.storeId,
      permissions,
      isSystem: false,
    },
  });

  return NextResponse.json({ role }, { status: 201 });
}
