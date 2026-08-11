'use client';

import { useState, useEffect, useCallback } from 'react';

interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  isSystem: boolean;
  _count: { staff: number };
}

const PERMISSION_LABELS: Record<string, string> = {
  viewDashboard: 'ダッシュボード閲覧',
  viewCustomers: '顧客一覧閲覧',
  createCustomer: '顧客登録',
  editCustomer: '顧客編集',
  deleteCustomer: '顧客削除',
  viewCharges: '入金履歴閲覧',
  createCharge: '入金実行',
  cancelCharge: '入金取消',
  viewPayments: '利用履歴閲覧',
  createPayment: '利用実行',
  cancelPayment: '利用取消',
  viewTransactions: '取引履歴閲覧',
  exportTransactions: 'CSV出力',
  manageStoreSettings: '店舗設定管理',
  manageRoles: 'ロール管理',
  manageStaff: 'スタッフ管理',
  viewTotalBalance: '総残高閲覧',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: {} as Record<string, boolean>,
  });

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRoles(data.roles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openCreateModal = () => {
    setEditingRole(null);
    const defaultPermissions: Record<string, boolean> = {};
    Object.keys(PERMISSION_LABELS).forEach((key) => {
      defaultPermissions[key] = false;
    });
    setFormData({ name: '', permissions: defaultPermissions });
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    if (role.isSystem) {
      alert('システムロールは編集できません。');
      return;
    }
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: { ...role.permissions },
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('ロール名を入力してください。');
      return;
    }

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          permissions: formData.permissions,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '保存に失敗しました。');
      }

      await fetchRoles();
      setShowModal(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      alert('システムロールは削除できません。');
      return;
    }
    if (role._count.staff > 0) {
      alert('このロールはスタッフに割り当てられているため削除できません。');
      return;
    }
    if (!confirm(`「${role.name}」を削除してよろしいですか？`)) return;

    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '削除に失敗しました。');
      }
      await fetchRoles();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const togglePermission = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ロール管理</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 新規ロール
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ロール名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">権限数</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">スタッフ数</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => {
              const permissionCount = Object.values(role.permissions).filter(Boolean).length;
              return (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.isSystem && (
                        <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                          システム
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {permissionCount} / {Object.keys(PERMISSION_LABELS).length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {role._count.staff}人
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => openEditModal(role)}
                      disabled={role.isSystem}
                      className={`px-3 py-1 text-sm rounded mr-2 ${
                        role.isSystem
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={role.isSystem || role._count.staff > 0}
                      className={`px-3 py-1 text-sm rounded ${
                        role.isSystem || role._count.staff > 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ロール作成/編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingRole ? 'ロール編集' : '新規ロール作成'}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">ロール名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例: アルバイト"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">権限設定</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.permissions[key] || false}
                      onChange={() => togglePermission(key)}
                      className="w-4 h-4 text-blue-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingRole ? '更新' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
