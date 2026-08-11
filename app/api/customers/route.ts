import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff, hasPermission } from '@/lib/utils/auth';

// 顧客一覧取得
export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('viewCustomers')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const page = parseInt(searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  const where = {
    storeId: staff.storeId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        transactions: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  // 各顧客の最新残高を計算
  const customersWithBalance = customers.map((customer) => {
    const latestTransaction = customer.transactions[0];
    const balance = latestTransaction ? latestTransaction.balanceAfter : 0;
    const { transactions, ...customerWithoutTransactions } = customer;
    return { ...customerWithoutTransactions, balance };
  });

  return NextResponse.json({
    customers: customersWithBalance,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// 新規顧客登録
export async function POST(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('createCustomer')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const body = await request.json();
  const { name, phone, email, memo } = body;

  if (!name) {
    return NextResponse.json(
      { error: '顧客名は必須です。' },
      { status: 400 }
    );
  }

  // 電話番号またはメールの重複チェック
  if (phone) {
    const existing = await prisma.customer.findFirst({
      where: { storeId: staff.storeId, phone },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'この電話番号は既に登録されています。' },
        { status: 400 }
      );
    }
  }

  if (email) {
    const existing = await prisma.customer.findFirst({
      where: { storeId: staff.storeId, email },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています。' },
        { status: 400 }
      );
    }
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      memo: memo || null,
      storeId: staff.storeId,
    },
  });

  return NextResponse.json({ customer }, { status: 201 });
}
