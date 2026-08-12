'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CustomerSignupPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  // トークンを検証
  useEffect(() => {
    if (!token) {
      setError('無効なURLです。');
      setLoading(false);
      return;
    }

    fetch(`/api/customer/verify-token?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setValid(true);
          setCustomer(data.customer);
        } else {
          setError(data.error || '無効なQRコードです。');
        }
      })
      .catch(() => {
        setError('サーバーエラーが発生しました。');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = () => {
    if (!agreed) {
      alert('利用規約に同意してください。');
      return;
    }
    // 次のステップ（SMS認証）へ進む
    window.location.href = `/customer/verify?token=${token}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ エラー</h1>
          <p className="text-gray-700">{error}</p>
          <p className="text-sm text-gray-500 mt-4">店舗スタッフにお問い合わせください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2">📋 会員登録</h1>
        <p className="text-center text-gray-600 mb-6">
          以下の内容で登録します。よろしければ利用規約に同意してください。
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">お名前</p>
          <p className="font-medium">{customer?.name || '—'}</p>
          <p className="text-sm text-gray-600 mt-2">電話番号</p>
          <p className="font-medium">{customer?.phone || '—'}</p>
        </div>

        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              <span className="font-bold text-red-500">利用規約</span> に同意します。
              <br />
              <span className="text-xs text-gray-500">
                （個人情報の取り扱いについて同意する必要があります）
              </span>
            </span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!agreed}
          className={`w-full py-3 rounded-lg text-white font-bold transition ${
            agreed
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          SMS認証に進む
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          このURLは24時間有効です。
        </p>
      </div>
    </div>
  );
}
