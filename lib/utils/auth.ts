import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
// import { Staff, Role } from '@prisma/client'; ← この行を削除

const SESSION_COOKIE_NAME = 'picopay_session';

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// パスワード検証
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// セッション作成（ログイン時に呼ぶ）
export async function createSession(staffId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, staffId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1週間
    path: '/',
  });
}

// セッション削除（ログアウト）
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ★ 戻り値の型を any に変更
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

// ★ 権限チェック（staff を any で扱う）
export async function hasPermission(permissionKey: string): Promise<boolean> {
  const staff = await getCurrentStaff();
  if (!staff) return false;

  const permissions = staff.role.permissions as Record<string, boolean>;
  return permissions[permissionKey] === true;
}

// ミドルウェア用：権限チェック（同期的に使う簡易版）
export function checkPermissionSync(permissions: Record<string, boolean>, key: string): boolean {
  return permissions?.[key] === true;
}
