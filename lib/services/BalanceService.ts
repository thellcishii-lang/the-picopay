import { prisma } from '@/lib/prisma';

export class BalanceService {
  /**
   * 入金処理（チャージ）
   */
  static async charge(
    customerId: string,
    amount: number,
    staffId: string,
    note?: string
  ) {
    if (amount <= 0) {
      throw new Error('入金額は正の値を指定してください。');
    }

    // ★ tx に any 型を付ける
    return await prisma.$transaction(async (tx: any) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('顧客が見つかりません。');
      }

      const currentBalance = await this.getCurrentBalance(tx, customerId);
      const newBalance = currentBalance + amount;

      return tx.transaction.create({
        data: {
          customerId,
          storeId: customer.storeId,
          type: 'charge',
          amount,
          balanceAfter: newBalance,
          staffId,
          note: note || null,
          occurredAt: new Date(),
        },
      });
    });
  }

  /**
   * 利用処理（支払い）
   */
  static async pay(
    customerId: string,
    amount: number,
    staffId: string,
    note?: string
  ) {
    if (amount <= 0) {
      throw new Error('利用額は正の値を指定してください。');
    }

    // ★ tx に any 型を付ける
    return await prisma.$transaction(async (tx: any) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('顧客が見つかりません。');
      }

      const currentBalance = await this.getCurrentBalance(tx, customerId);

      if (currentBalance < amount) {
        throw new Error(`残高が不足しています。（残高: ${currentBalance}円, 要求: ${amount}円）`);
      }

      const newBalance = currentBalance - amount;

      return tx.transaction.create({
        data: {
          customerId,
          storeId: customer.storeId,
          type: 'pay',
          amount,
          balanceAfter: newBalance,
          staffId,
          note: note || null,
          occurredAt: new Date(),
        },
      });
    });
  }

  /**
   * 取引取消（最終取引を取り消す）
   */
  static async cancel(
    customerId: string,
    staffId: string,
    reason?: string
  ) {
    // ★ tx に any 型を付ける
    return await prisma.$transaction(async (tx: any) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('顧客が見つかりません。');
      }

      const lastTransaction = await tx.transaction.findFirst({
        where: { customerId },
        orderBy: { occurredAt: 'desc' },
      });

      if (!lastTransaction) {
        throw new Error('取消可能な取引がありません。');
      }

      if (lastTransaction.type === 'cancel') {
        throw new Error('この取引は既にキャンセルされています。');
      }

      return tx.transaction.create({
        data: {
          customerId,
          storeId: customer.storeId,
          type: 'cancel',
          amount: lastTransaction.amount,
          balanceAfter: lastTransaction.balanceAfter,
          staffId,
          note: reason || `取引ID: ${lastTransaction.id} の取消`,
          occurredAt: new Date(),
        },
      });
    });
  }

  /**
   * 現在の残高を取得（トランザクション内で使用）
   */
  private static async getCurrentBalance(tx: any, customerId: string): Promise<number> {
    const last = await tx.transaction.findFirst({
      where: { customerId },
      orderBy: { occurredAt: 'desc' },
    });

    return last ? last.balanceAfter : 0;
  }

  /**
   * 顧客の現在の残高を取得（外部用）
   */
  static async getBalance(customerId: string): Promise<number> {
    const last = await prisma.transaction.findFirst({
      where: { customerId },
      orderBy: { occurredAt: 'desc' },
    });

    return last ? last.balanceAfter : 0;
  }

  /**
   * 店舗の総前受金残高を取得
   */
  static async getTotalBalance(storeId: string): Promise<number> {
    const result = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(balance_after), 0) as total
      FROM (
        SELECT DISTINCT ON (customer_id) balance_after
        FROM transactions
        WHERE store_id = ${storeId}
        ORDER BY customer_id, occurred_at DESC
      ) AS latest_balances
    `;

    return Number(result[0]?.total || 0);
  }

  /**
   * 取引履歴を取得（ページネーション対応）
   */
  static async getTransactions(
    storeId: string,
    options?: {
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      type?: 'charge' | 'pay' | 'cancel';
      limit?: number;
      page?: number;
    }
  ) {
    const { customerId, startDate, endDate, type, limit = 50, page = 1 } = options || {};
    const offset = (page - 1) * limit;

    const where: any = { storeId };

    if (customerId) where.customerId = customerId;
    if (type) where.type = type;
    if (startDate) where.occurredAt = { gte: startDate };
    if (endDate) where.occurredAt = { ...where.occurredAt, lte: endDate };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          staff: {
            select: { id: true, name: true },
          },
        },
        orderBy: { occurredAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
