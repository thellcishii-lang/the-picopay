'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  memo: string | null;
  balance: number;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'charge' | 'pay'>('charge');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  // ★ QRコード発行用のstate
  const [showQrForm, setShowQrForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);

  // 顧客一覧を取得
  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: '50',
      });
      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // 入金/利用処理
  const handleTransaction = async () => {
    if (!selectedCustomer || !amount || parseInt(amount) <= 0) {
      alert('金額を正しく入力してください。');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          type: modalType,
          amount: parseInt(amount),
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '処理に失敗しました。');
      }

      await fetchCustomers();
      setShowModal(false);
      setAmount('');
      setNote('');
      setSelectedCustomer(null);
    } catch (error: any) {
      alert(error.message || 'エラーが発生しました。');
    } finally {
      setProcessing(false);
    }
  };

  // モーダルを開く
  const openModal = (customer: Customer, type: 'charge' | 'pay') => {
    setSelectedCustomer(customer);
    setModalType(type);
    setAmount('');
    setNote('');
    setShowModal(true);
  };

  // ★ QR発行フォームを開く
  const handleOpenQrForm = () => {
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowQrForm(true);
  };

  // ★ QRコード生成APIを呼ぶ
  const handleGenerateQR = async () => {
    if (!newCustomerName || !newCustomerPhone) {
      alert('名前と電話番号を入力してください。');
      return;
    }

    try {
      const res = await fetch('/api/customer/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName,
          phone: newCustomerPhone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'QRコードの生成に失敗しました');
        return;
      }

      setQrData(data);
      setShowQrModal(true);
      setShowQrForm(false);
    } catch (error) {
      alert('エラーが発生しました');
    }
  };

  return (
    <div className="p-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">顧客管理</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="名前・電話番号で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
          />
          {/* ★ QR発行ボタン */}
          <button
            onClick={handleOpenQrForm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📱 新規顧客QR発行
          </button>
          <button
            onClick={() => {
              const name = prompt('顧客名を入力してください：');
              if (name) {
                fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name }),
                }).then(() => fetchCustomers());
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 新規顧客
          </button>
        </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    電話番号
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    残高
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      顧客が見つかりませんでした。
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {customer.phone || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                        <span className={customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ¥{customer.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openModal(customer, 'charge')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 mr-2 text-sm"
                        >
                          入金
                        </button>
                        <button
                          onClick={() => openModal(customer, 'pay')}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm"
                        >
                          利用
                        </button>
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
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchCustomers(p)}
                  className={`px-4 py-2 border rounded ${
                    p === pagination.page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 入金/利用モーダル */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {modalType === 'charge' ? '💰 入金' : '💳 利用'}
            </h2>
            <div className="mb-4">
              <p className="text-gray-600">
                顧客: <span className="font-bold">{selectedCustomer.name}</span>
              </p>
              <p className="text-gray-600">
                現在の残高: <span className="font-bold">¥{selectedCustomer.balance.toLocaleString()}</span>
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {modalType === 'charge' ? '入金額' : '利用額'}
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">備考（任意）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="伝票番号やメモ"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedCustomer(null);
                  setAmount('');
                  setNote('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleTransaction}
                disabled={processing}
                className={`px-6 py-2 rounded-lg text-white ${
                  modalType === 'charge'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50`}
              >
                {processing ? '処理中...' : modalType === 'charge' ? '入金確定' : '利用確定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ★ 名前・電話番号入力フォーム（モーダル） */}
      {showQrForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">📝 顧客情報を入力</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  顧客名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例：山田太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例：09012345678"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowQrForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleGenerateQR}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  QRコード発行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ★ QRコード表示モーダル */}
      {showQrModal && qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">📱 顧客登録用QRコード</h2>
            <div className="flex justify-center mb-4">
              <img src={qrData.qrImage} alt="QRコード" className="w-64 h-64" />
            </div>
            <p className="text-sm text-gray-600 mb-2">
              お客様にこのQRコードを読み取ってもらってください
            </p>
            <p className="text-xs text-gray-500">
              有効期限: {new Date(qrData.expiresAt).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 break-all mt-2">
              URL: {qrData.signupUrl}
            </p>
            <button
              onClick={() => {
                setShowQrModal(false);
                setQrData(null);
                fetchCustomers(); // 一覧を更新
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
