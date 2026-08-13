'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAKwyjQexM3IpWwfPxO3uhUBnBt1fD2EA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "the-picopay.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-picopay",
};

console.log('🔥 Firebase Config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log('🐛', msg);
    setDebugLog(prev => [...prev, msg]);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('無効なURLです。');
      addLog('❌ トークンなし');
      return;
    }

    fetch(`/api/customer/verify-token?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.customer) {
          setPhoneNumber(data.customer.phone || '');
          addLog(`✅ 顧客情報取得: ${data.customer.name} (${data.customer.phone})`);
        } else {
          setError(data.error || '無効なQRコードです。');
          addLog(`❌ 顧客情報取得失敗: ${data.error}`);
        }
      })
      .catch(() => {
        setError('サーバーエラーが発生しました。');
        addLog('❌ サーバーエラー');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const sendSms = async () => {
    if (!phoneNumber) {
      addLog('⚠️ 電話番号が空です');
      return;
    }

    addLog(`📨 SMS送信開始: ${phoneNumber}`);
    setSending(true);
    setError('');

    try {
      const formattedPhone = phoneNumber.startsWith('0')
        ? `+81${phoneNumber.slice(1)}`
        : phoneNumber;

      addLog(`📞 変換後: ${formattedPhone}`);

      const recaptchaVerifier = new RecaptchaVerifier(auth, 'send-sms-button', {
        size: 'invisible',
      });

      addLog('🔐 reCAPTCHA設定完了');
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(result);
      addLog('✅ SMS送信成功！認証コードを待っています');
    } catch (err: any) {
      addLog(`❌ SMS送信エラー: ${err.message}`);
      setError(err.message || 'SMS送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult || !code) {
      addLog('⚠️ 認証コードが空です');
      return;
    }

    addLog(`🔑 認証コード確認: ${code}`);
    try {
      await confirmationResult.confirm(code);
      addLog('✅ 認証成功！');

      const res = await fetch('/api/customer/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('更新に失敗しました。');
      addLog('✅ 顧客情報更新完了 → ダッシュボードへ');
      router.push('/customer/dashboard');
    } catch (err: any) {
      addLog(`❌ 認証エラー: ${err.message}`);
      setError(err.message || '認証コードが正しくありません。');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2">📱 SMS認証</h1>
        <p className="text-center text-gray-600 mb-6">
          入力された電話番号にSMSで認証コードを送信します。
        </p>

        {!confirmationResult ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">電話番号</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!!confirmationResult}
              />
            </div>
            <button
              id="send-sms-button"
              onClick={sendSms}
              disabled={sending || !phoneNumber}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? '送信中...' : '📨 SMSを送信'}
            </button>
          </>
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
              disabled={!code}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              ✅ 認証する
            </button>
          </>
        )}

        {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}

        {/* デバッグログ表示（開発中のみ） */}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-gray-400 font-bold">🐛 デバッグログ</p>
          <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2 text-xs font-mono">
            {debugLog.length === 0 ? (
              <span className="text-gray-400">ログがありません</span>
            ) : (
              debugLog.map((log, i) => (
                <div key={i} className="border-b border-gray-200 py-1">{log}</div>
              ))
            )}
          </div>
        </div>
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
