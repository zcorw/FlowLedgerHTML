import { z } from 'zod';

const advanceMinutesSchema = z
  .string()
  .optional()
  .nullable()
  .refine((value) => !value || /^\d+$/.test(value), '提前分钟必须为整数')
  .refine((value) => {
    if (!value) return true;
    const minutes = Number(value);
    return Number.isFinite(minutes) && minutes >= 0 && minutes <= 10080;
  }, '提前分钟范围为 0-10080');

export const schedulerJobSchema = z.object({
  name: z.string().min(1, '请输入任务名称').max(120, '任务名称最多 120 个字符'),
  description: z.string().max(500, '描述最多 500 个字符').optional().nullable(),
  rule: z.string().min(3, '请输入规则').max(200, '规则最多 200 个字符'),
  firstRunAt: z.string().min(1, '请选择首次执行时间'),
  advanceMinutes: advanceMinutesSchema,
  channel: z.string().min(1, '请输入通知渠道').max(32, '通知渠道最多 32 个字符'),
  status: z.string().min(1, '请输入状态').max(16, '状态最多 16 个字符'),
});

export type SchedulerJobFormValues = z.infer<typeof schedulerJobSchema>;
