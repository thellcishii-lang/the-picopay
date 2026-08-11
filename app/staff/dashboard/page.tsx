'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: { name: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        setStaff(data.staff);
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <div className="p-8">読み込み中...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">ダッシュボード</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-lg">
          ようこそ、<strong>{staff?.name}</strong> さん
        </p>
        <p className="text-gray-600">ロール: {staff?.role.name}</p>
      </div>
    </div>
  );
}
