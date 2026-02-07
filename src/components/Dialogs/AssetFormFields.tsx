import type { ReactNode } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { AssetTypes, RiskLevelTypes, type DepositFormValues } from "@/validation/deposit";

type Props = {
  form: DepositFormValues;
  errors: Partial<Record<keyof DepositFormValues, string>>;
  currencyOptions: { label: string; value: string }[];
  onChange: (key: keyof DepositFormValues, value: string) => void;
  afterType?: ReactNode;
};

const AssetFormFields = ({ form, errors, currencyOptions, onChange, afterType }: Props) => {
  return (
    <Stack spacing={2}>
      <TextField
        label="资产名称"
        value={form.name}
        onChange={(e) => onChange("name", e.target.value)}
        fullWidth
        required
        error={!!errors.name}
        helperText={errors.name}
      />
      <TextField
        label="资产类型"
        select
        value={form.type}
        onChange={(e) => onChange("type", e.target.value)}
        fullWidth
        required
        error={!!errors.type}
        helperText={errors.type}
      >
        {AssetTypes.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      {afterType}
      <TextField
        label="币种"
        select
        value={form.currency}
        onChange={(e) => onChange("currency", e.target.value)}
        fullWidth
        required
        error={!!errors.currency}
        helperText={errors.currency}
      >
        {currencyOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="风险等级"
        select
        value={form.riskLevel}
        onChange={(e) => onChange("riskLevel", e.target.value)}
        fullWidth
        required
        error={!!errors.riskLevel}
        helperText={errors.riskLevel}
      >
        {RiskLevelTypes.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
};

export default AssetFormFields;
