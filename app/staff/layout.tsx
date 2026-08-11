import { redirect } from 'next/navigation';
import { getCurrentStaff } from '@/lib/utils/auth';
import Sidebar from '@/components/common/Sidebar';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentStaff();

  if (!staff) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar staff={staff} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
