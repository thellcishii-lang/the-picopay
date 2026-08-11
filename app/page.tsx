import { redirect } from 'next/navigation';
import { getCurrentStaff } from '@/lib/utils/auth';

export default async function HomePage() {
  const staff = await getCurrentStaff();

  if (staff) {
    redirect('/staff/dashboard');
  } else {
    redirect('/login');
  }
}
