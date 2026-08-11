import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff, hasPermission } from '@/lib/utils/auth';

// ロール更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('manageRoles')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const body = await request.json();
  const { name, permissions } = body;

  const role = await prisma.role.findUnique({
    where: { id: params.id },
  });

  if (!role || role.storeId !== staff.storeId) {
    return NextResponse.json({ error: 'ロールが見つかりません。' }, { status: 404 });
  }

  // システムロールは編集不可
  if (role.isSystem) {
    return NextResponse.json(
      { error: 'システムロールは編集できません。' },
      { status: 403 }
    );
  }

  const updated = await prisma.role.update({
    where: { id: params.id },
    data: {
      name: name || role.name,
      permissions: permissions || role.permissions,
    },
  });

  return NextResponse.json({ role: updated });
}

// ロール削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('manageRoles')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const role = await prisma.role.findUnique({
    where: { id: params.id },
    include: { _count: { select: { staff: true } } },
  });

  if (!role || role.storeId !== staff.storeId) {
    return NextResponse.json({ error: 'ロールが見つかりません。' }, { status: 404 });
  }

  if (role.isSystem) {
    return NextResponse.json(
      { error: 'システムロールは削除できません。' },
      { status: 403 }
    );
  }

  // スタッフが割り当てられているロールは削除不可
  if (role._count.staff > 0) {
    return NextResponse.json(
      { error: 'このロールはスタッフに割り当てられているため削除できません。' },
      { status: 400 }
    );
  }

  await prisma.role.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}