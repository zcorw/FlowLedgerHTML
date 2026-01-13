import { z } from 'zod';

// 资产创建表单校验
export const depositSchema = z.object({
  name: z.string().min(1, '请输入资产名称').max(50, '资产名称最多 50 字符'),
  type: z.enum(["deposit", "investment", "securities", "other"], { message: '请选择存款类型' }),
  currency: z.string().min(1, '请选择币种'),
  riskLevel: z.enum(["flexible", "stable", "high_risk"], { message: '请选择风险等级' }),
  institutionId: z.number({ message: '请选择金融机构' }),
});

// 机构创建表单校验
export const institutionSchema = z.object({
  name: z.string().min(1, '请输入机构名称').max(50, '机构名称最多 50 字符'),
  type: z.enum(['bank','broker','other'], { message: '请选择机构类型' }),
});

export type DepositFormValues = z.infer<typeof depositSchema>;
export type InstitutionFormValues = z.infer<typeof institutionSchema>;