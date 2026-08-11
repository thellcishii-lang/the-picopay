// components/common/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  staff: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
}

export default function Sidebar({ staff }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { href: '/staff/dashboard', label: '📊 ダッシュボード' },
    { href: '/staff/customers', label: '👤 顧客管理' },
    { href: '/staff/transactions', label: '📋 取引履歴' },
    { href: '/staff/settings/roles', label: '⚙️ ロール管理' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="text-xl font-bold mb-8 px-2">PicoPay</div>
      <div className="px-2 mb-6">
        <p className="text-sm text-gray-400">{staff.name}</p>
        <p className="text-xs text-gray-500">{staff.role.name}</p>
      </div>
      <nav className="flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-3 rounded-lg mb-1 transition ${
              pathname === item.href
                ? 'bg-blue-600'
                : 'hover:bg-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
      >
        🚪 ログアウト
      </button>
    </div>
  );
}
