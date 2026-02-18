import { z } from 'zod';

export const expenseSchema = z.object({
  name: z.string().min(1, '请输入消费名称'),
  amount: z.string().min(1, '请输入金额').regex(/^\d+(\.\d{1,6})?$/, '金额格式不正确'),
  currency: z.string().min(1, '请选择币种'),
  categoryId: z.string().optional().nullable(),
  merchant: z.string().optional().nullable(),
  occurredAt: z.string().min(1, '请选择时间'),
  paidAccountId: z.number().optional().nullable(),
  fileId: z.number().optional().nullable(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
