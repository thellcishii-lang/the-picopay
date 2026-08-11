import { NextRequest, NextResponse } from 'next/server';
import { BalanceService } from '@/lib/services/BalanceService';
import { getCurrentStaff, hasPermission } from '@/lib/utils/auth';

// 残高照会（GET）
export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const customerId = searchParams.get('customerId');

  // 総残高の場合は別途権限チェック
  if (!customerId) {
    if (!await hasPermission('viewTotalBalance')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    const total = await BalanceService.getTotalBalance(staff.storeId);
    return NextResponse.json({ total });
  }

  if (!await hasPermission('viewCustomers')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const balance = await BalanceService.getBalance(customerId);
  return NextResponse.json({ customerId, balance });
}

// 入金/利用処理（POST）
export async function POST(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  const body = await request.json();
  const { customerId, type, amount, note } = body;

  if (!customerId || !type || !amount) {
    return NextResponse.json(
      { error: '顧客ID、取引種別、金額は必須です。' },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json(
      { error: '金額は正の値を指定してください。' },
      { status: 400 }
    );
  }

  try {
    let transaction;

    if (type === 'charge') {
      if (!await hasPermission('createCharge')) {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 });
      }
      transaction = await BalanceService.charge(customerId, amount, staff.id, note);
    } else if (type === 'pay') {
      if (!await hasPermission('createPayment')) {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 });
      }
      transaction = await BalanceService.pay(customerId, amount, staff.id, note);
    } else {
      return NextResponse.json(
        { error: '取引種別は charge または pay を指定してください。' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '処理中にエラーが発生しました。' },
      { status: 400 }
    );
  }
}
