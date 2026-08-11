import { NextResponse } from 'next/server';
import { getCurrentStaff } from '@/lib/utils/auth';

export async function GET() {
  const staff = await getCurrentStaff();

  if (!staff) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  const { password: _, ...staffWithoutPassword } = staff;
  return NextResponse.json({ staff: staffWithoutPassword });
}
