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
        // ★ staff を削除
      },
      orderBy: { occurredAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
