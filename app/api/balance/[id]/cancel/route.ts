import { NextRequest, NextResponse } from 'next/server';
import { BalanceService } from '@/lib/services/BalanceService';
import { getCurrentStaff, hasPermission } from '@/lib/utils/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  // 取消権限チェック（入金取消 or 利用取消）
  const body = await request.json();
  const { reason } = body;

  try {
    const transaction = await BalanceService.cancel(params.id, staff.id, reason);

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '取消処理中にエラーが発生しました。' },
      { status: 400 }
    );
  }
}
