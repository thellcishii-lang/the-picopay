'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardData {
  totalBalance: number;
  todayCharge: number;
  todayPay: number;
  todayNet: number;
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    customer: { name: string };
    occurredAt: string;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    // スタッフ情報取得
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        setStaffName(data.staff.name);
      })
      .catch(() => {
        router.push('/login');
      });

    // ダッシュボードデータ取得
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch('/api/balance'),
        fetch('/api/transactions?limit=10'),
      ]);

      const balanceData = await balanceRes.json();
      const transactionsData = await transactionsRes.json();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTransactions = transactionsData.transactions?.filter((t: any) => {
        const date = new Date(t.occurredAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      }) || [];

      const todayCharge = todayTransactions
        .filter((t: any) => t.type === 'charge')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const todayPay = todayTransactions
        .filter((t: any) => t.type === 'pay')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      setData({
        totalBalance: balanceData.total || 0,
        todayCharge,
        todayPay,
        todayNet: todayCharge - todayPay,
        recentTransactions: transactionsData.transactions?.slice(0, 10) || [],
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600">こんにちは、{staffName} さん</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">総前受金残高</p>
          <p className="text-3xl font-bold text-blue-600">
            ¥{data?.totalBalance.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">本日の入金</p>
          <p className="text-3xl font-bold text-green-600">
            ¥{data?.todayCharge.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">本日の利用</p>
          <p className="text-3xl font-bold text-orange-600">
            ¥{data?.todayPay.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">本日の増減</p>
          <p className={`text-3xl font-bold ${(data?.todayNet || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {data?.todayNet && data.todayNet >= 0 ? '+' : ''}
            ¥{data?.todayNet.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold">最近の取引</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">顧客</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    取引がありません。
                  </td>
                </tr>
              ) : (
                data?.recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(t.occurredAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {t.customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        t.type === 'charge' ? 'bg-blue-100 text-blue-700' :
                        t.type === 'pay' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t.type === 'charge' ? '入金' : t.type === 'pay' ? '利用' : '取消'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                      <span className={t.type === 'charge' ? 'text-blue-600' : t.type === 'pay' ? 'text-orange-600' : 'text-gray-500'}>
                        {t.type === 'charge' ? '+' : t.type === 'pay' ? '-' : ''}
                        ¥{t.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
