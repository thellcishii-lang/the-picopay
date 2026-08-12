import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'picopay_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// パスワード検証（一時的なデバッグ用）
// パスワード検証（本番用）
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// セッション作成
export async function createSession(staffId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, staffId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentStaff(): Promise<any> {
  const cookieStore = await cookies();
  const staffId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!staffId) return null;
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { role: true },
  });
  return staff;
}

export async function hasPermission(permissionKey: string): Promise<boolean> {
  const staff = await getCurrentStaff();
  if (!staff) return false;
  const permissions = staff.role.permissions as Record<string, boolean>;
  return permissions[permissionKey] === true;
}

export function checkPermissionSync(permissions: Record<string, boolean>, key: string): boolean {
  return permissions?.[key] === true;
}
