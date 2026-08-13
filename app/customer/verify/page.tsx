'use client';

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

// ★ 本当にこの値が正しいか確認
const firebaseConfig = {
  apiKey: "AIzaSyAKwyjQexM3IpWwfPxO3uhUBnBt1fD2EA",
  authDomain: "the-picopay.firebaseapp.com",
  projectId: "the-picopay",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function TestPage() {
  const [phone, setPhone] = useState('09012345678');
  const [status, setStatus] = useState('');

  const sendSms = async () => {
    try {
      const formatted = phone.startsWith('0') ? `+81${phone.slice(1)}` : phone;
      
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
      });
      await verifier.render();

      const result = await signInWithPhoneNumber(auth, formatted, verifier);
      setStatus('✅ SMS送信成功！');
    } catch (err: any) {
      setStatus('❌ ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">SMSテスト</h1>
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border p-2 rounded my-4"
      />
      <div id="recaptcha-container"></div>
      <button onClick={sendSms} className="bg-blue-600 text-white px-4 py-2 rounded">
        SMS送信
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
}
