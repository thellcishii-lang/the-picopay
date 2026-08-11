// app/layout.tsx（修正後）
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PicoPay',
  description: '前受金決済システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
