'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';

// Firebase 設定（環境変数から取得）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... その他必要な設定
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  // トークンから顧客情報を取得
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
          setCustomer(data.customer);
          setPhoneNumber(data.customer.phone);
        } else {
          setError(data.error || '無効なQRコードです。');
        }
      })
      .catch(() => setError('サーバーエラーが発生しました。'))
      .finally(() => setLoading(false));
  }, [token]);

  // SMS送信
  const sendSms = async () => {
    if (!phoneNumber) return;
    setSending(true);
    setError('');
    try {
      // 電話番号は +81 から始まる形式に変換（日本の場合）
      const formattedPhone = phoneNumber.startsWith('0')
        ? `+81${phoneNumber.slice(1)}`
        : phoneNumber;

      const result = await signInWithPhoneNumber(auth, formattedPhone);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message || 'SMS送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  // コード検証
  const verifyCode = async () => {
    if (!confirmationResult || !code) return;
    setVerifying(true);
    setError('');
    try {
      await confirmationResult.confirm(code);
      // 認証成功 → バックエンドで顧客情報を更新
      const res = await fetch('/api/customer/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '更新に失敗しました。');
      // 顧客ダッシュボードへ遷移
      router.push('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || '認証コードが正しくありません。');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2">📱 SMS認証</h1>
        <p className="text-center text-gray-600 mb-6">
          入力された電話番号にSMSで認証コードを送信します。
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">電話番号</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="09012345678"
            disabled={!!confirmationResult}
          />
        </div>

        {!confirmationResult ? (
          <button
            onClick={sendSms}
            disabled={sending || !phoneNumber}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? '送信中...' : '📨 SMSを送信'}
          </button>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">認証コード</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <button
              onClick={verifyCode}
              disabled={verifying || !code}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {verifying ? '確認中...' : '✅ 認証する'}
            </button>
          </>
        )}

        {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
