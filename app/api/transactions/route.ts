import { NextRequest, NextResponse } from 'next/server';
import { BalanceService } from '@/lib/services/BalanceService';
import { getCurrentStaff, hasPermission } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  if (!await hasPermission('viewTransactions')) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const customerId = searchParams.get('customerId') || undefined;
  const type = searchParams.get('type') as 'charge' | 'pay' | 'cancel' | undefined;
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
  const limit = parseInt(searchParams.get('limit') || '50');
  const page = parseInt(searchParams.get('page') || '1');

  const result = await BalanceService.getTransactions(staff.storeId, {
    customerId,
    type,
    startDate,
    endDate,
    limit,
    page,
  });

  return NextResponse.json(result);
}
