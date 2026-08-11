'use client';

import { useState, useEffect, useCallback } from 'react';

interface Transaction {
  id: string;
  type: 'charge' | 'pay' | 'cancel';
  amount: number;
  balanceAfter: number;
  note: string | null;
  occurredAt: string;
  customer: { id: string; name: string; phone: string | null };
  staff: { id: string; name: string } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
      });
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // CSV出力（簡易版）
  const exportCSV = () => {
    const headers = ['日時', '顧客名', '種別', '金額', '残高', '備考'];
    const rows = transactions.map((t) => [
      new Date(t.occurredAt).toLocaleString(),
      t.customer.name,
      t.type === 'charge' ? '入金' : t.type === 'pay' ? '利用' : '取消',
      t.amount,
      t.balanceAfter,
      t.note || '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `取引履歴_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">取引履歴</h1>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          📥 CSV出力
        </button>
      </div>

      {/* フィルター */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">種別</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="mt-1 px-3 py-2 border rounded-lg"
          >
            <option value="">すべて</option>
            <option value="charge">入金</option>
            <option value="pay">利用</option>
            <option value="cancel">取消</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">開始日</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="mt-1 px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">終了日</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="mt-1 px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          onClick={() => fetchTransactions()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          絞り込む
        </button>
      </div>

      {/* テーブル */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">顧客</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">残高</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">担当</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      取引が見つかりませんでした。
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(t.occurredAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{t.customer.name}</div>
                        {t.customer.phone && (
                          <div className="text-sm text-gray-500">{t.customer.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            t.type === 'charge'
                              ? 'bg-blue-100 text-blue-700'
                              : t.type === 'pay'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {t.type === 'charge' ? '入金' : t.type === 'pay' ? '利用' : '取消'}
                        </span>
                        {t.note && (
                          <div className="text-xs text-gray-400 mt-1">{t.note}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                        <span
                          className={
                            t.type === 'charge'
                              ? 'text-blue-600'
                              : t.type === 'pay'
                              ? 'text-orange-600'
                              : 'text-gray-500'
                          }
                        >
                          {t.type === 'charge' ? '+' : t.type === 'pay' ? '-' : ''}
                          ¥{t.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        ¥{t.balanceAfter.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {t.staff?.name || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchTransactions(p)}
                  className={`px-4 py-2 border rounded ${
                    p === pagination.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              {pagination.totalPages > 10 && (
                <span className="px-4 py-2 text-gray-500">...</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
