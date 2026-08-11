import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/utils/auth';

const prisma = new PrismaClient();

async function main() {
  // デフォルト権限（全権限 true）
  const allPermissions = {
    viewDashboard: true,
    viewCustomers: true,
    createCustomer: true,
    editCustomer: true,
    deleteCustomer: true,
    viewCharges: true,
    createCharge: true,
    cancelCharge: true,
    viewPayments: true,
    createPayment: true,
    cancelPayment: true,
    viewTransactions: true,
    exportTransactions: true,
    manageStoreSettings: true,
    manageRoles: true,
    manageStaff: true,
    viewTotalBalance: true,
  };

  // サンプル店舗作成
  const store = await prisma.store.create({
    data: {
      name: 'サンプル店舗',
      settings: {},
    },
  });

  // システムロール：オーナー（全権限）
  const ownerRole = await prisma.role.create({
    data: {
      name: 'オーナー',
      storeId: store.id,
      permissions: allPermissions,
      isSystem: true,
    },
  });

  // システムロール：店長（設定管理以外）
  const managerRole = await prisma.role.create({
    data: {
      name: '店長',
      storeId: store.id,
      permissions: {
        ...allPermissions,
        manageStoreSettings: false,
        manageRoles: false,
        manageStaff: false,
      },
      isSystem: true,
    },
  });

  // システムロール：レジスタッフ（最低限）
  const cashierRole = await prisma.role.create({
    data: {
      name: 'レジスタッフ',
      storeId: store.id,
      permissions: {
        viewDashboard: true,
        viewCustomers: true,
        createCustomer: true,
        editCustomer: false,
        deleteCustomer: false,
        viewCharges: true,
        createCharge: true,
        cancelCharge: false,
        viewPayments: true,
        createPayment: true,
        cancelPayment: false,
        viewTransactions: true,
        exportTransactions: false,
        manageStoreSettings: false,
        manageRoles: false,
        manageStaff: false,
        viewTotalBalance: false,
      },
      isSystem: true,
    },
  });

  // オーナーアカウント作成
  await prisma.staff.create({
    data: {
      email: 'owner@example.com',
      password: await hashPassword('password123'),
      name: 'オーナー',
      storeId: store.id,
      roleId: ownerRole.id,
    },
  });

  console.log('✅ シーディング完了！');
  console.log('📧 オーナーログイン: owner@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
