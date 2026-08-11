import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff, hasPermission } from '@/lib/utils/auth';

// 顧客詳細取得（残高付き）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('viewCustomers')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, storeId: staff.storeId },
    include: {
      transactions: {
        orderBy: { occurredAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: '顧客が見つかりません。' }, { status: 404 });
  }

  const latestTransaction = customer.transactions[0];
  const balance = latestTransaction ? latestTransaction.balanceAfter : 0;

  return NextResponse.json({ customer: { ...customer, balance } });
}

// 顧客情報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('editCustomer')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const body = await request.json();
  const { name, phone, email, memo } = body;

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, storeId: staff.storeId },
  });

  if (!customer) {
    return NextResponse.json({ error: '顧客が見つかりません。' }, { status: 404 });
  }

  // 電話番号の重複チェック（自分以外）
  if (phone) {
    const existing = await prisma.customer.findFirst({
      where: { storeId: staff.storeId, phone, NOT: { id: params.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'この電話番号は既に登録されています。' },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: {
      name: name || customer.name,
      phone: phone !== undefined ? phone : customer.phone,
      email: email !== undefined ? email : customer.email,
      memo: memo !== undefined ? memo : customer.memo,
    },
  });

  return NextResponse.json({ customer: updated });
}

// 顧客削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('deleteCustomer')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, storeId: staff.storeId },
  });

  if (!customer) {
    return NextResponse.json({ error: '顧客が見つかりません。' }, { status: 404 });
  }

  // 取引がある場合は削除不可
  const transactionCount = await prisma.transaction.count({
    where: { customerId: params.id },
  });

  if (transactionCount > 0) {
    return NextResponse.json(
      { error: '取引履歴がある顧客は削除できません。' },
      { status: 400 }
    );
  }

  await prisma.customer.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
