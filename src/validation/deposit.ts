import { z } from 'zod';
import type { InstitutionType, ProductType, RiskLevel} from '@/api/types';

export const Assets: readonly ProductType[] = ["deposit", "investment", "securities", "other"] as const;
export const RiskLevels: readonly RiskLevel[] = ["flexible", "stable", "high_risk"] as const;
export const Institutions: readonly InstitutionType[] = ["bank", "broker", "other"] as const;

// 资产类型选项
export const AssetTypes: readonly { value: ProductType; label: string }[] = [
  { value: "deposit", label: "存款" },
  { value: "investment", label: "投资" },
  { value: "securities", label: "证券" },
  { value: "other", label: "其他" },
];

// 风险等级选项
export const RiskLevelTypes: readonly { label: string; value: RiskLevel }[] = [
  { label: "灵活型", value: "flexible" },
  { label: "稳健型", value: "stable" },
  { label: "高风险型", value: "high_risk" },
];

export const InstitutionTypes: readonly { label: string; value: InstitutionType }[] = [
  { label: "银行", value: "bank" },
  { label: "券商", value: "broker" },
  { label: "其他", value: "other" },
];

// 资产创建表单校验
export const depositSchema = z.object({
  name: z.string().min(1, '请输入资产名称').max(50, '资产名称最多 50 字符'),
  type: z.enum(Assets, { message: '请选择存款类型' }),
  currency: z.string().min(1, '请选择币种'),
  riskLevel: z.enum(RiskLevels, { message: '请选择风险等级' }),
  institutionId: z.number({ message: '请选择金融机构' }),
});

// 机构创建表单校验
export const institutionSchema = z.object({
  name: z.string().min(1, '请输入机构名称').max(50, '机构名称最多 50 字符'),
  type: z.enum(Institutions, { message: '请选择机构类型' }),
});

// 批量资产余额表单校验
export const balanceSchema = z
  .object({
    status: z.string(),
    amount: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "active") {
      const ok = /^\d+(\.\d{1,2})?$/.test(data.amount ?? "");
      if (!ok) {
        ctx.addIssue({
          path: ["amount"],
          code: "custom",
          message: "请输入有效的金额",
        });
      }
    }
  });
export const balanceListSchema = z.array(balanceSchema);

export type DepositFormValues = z.infer<typeof depositSchema>;
export type InstitutionFormValues = z.infer<typeof institutionSchema>;