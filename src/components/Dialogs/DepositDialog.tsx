import { useEffect, useState } from "react";
import type { ZodError } from "zod";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { depositSchema, institutionSchema, type DepositFormValues, type InstitutionFormValues } from "@/validation/deposit";
import { enqueueSnackbar } from '@/store/snackbar';
import InstitutionSelect from "@/components/InstitutionSelect";
import type { Institution, Product } from "@/api/deposits";
import useCurrencyStore from "@/store/currency";

export type Mode = "asset" | "institution";

export type DepositSubmitPayload =
  | { mode: "asset"; asset: DepositFormValues }
  | { mode: "institution"; institution: InstitutionFormValues };

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: DepositSubmitPayload) => Promise<Product | Institution>;
};

type AssetType = DepositFormValues["type"];
type RiskLevel = DepositFormValues["riskLevel"];
const assetTypes: readonly {value: AssetType, label: string}[] = [
  { value: "deposit", label: "存款" },
  { value: "investment", label: "投资" },
  { value: "securities", label: "证券" },
  { value: "other", label: "其他" },
];
const riskLevels: readonly { label: string; value: RiskLevel }[] = [
  { label: "灵活型", value: "flexible" },
  { label: "稳健型", value: "stable" },
  { label: "高风险型", value: "high_risk" },
];
const institutionTypes: readonly { label: string; value: InstitutionFormValues["type"] }[] = [
  { label: "银行", value: "bank" },
  { label: "券商", value: "broker" },
  { label: "其他", value: "other" },
];

const buildDefaultAssetForm = (): DepositFormValues => ({
  name: "",
  type: depositSchema.shape.type.options[0],
  institutionId: 0,
  currency: "",
  riskLevel: depositSchema.shape.riskLevel.options[0],
});

const buildErrors = <T extends Record<string, unknown>>(error: ZodError) => {
  const next: Partial<Record<keyof T, string>> = {};
  for (const issue of error.issues) {
    const pathKey = issue.path[0];
    if (typeof pathKey === "string") {
      next[pathKey as keyof T] = issue.message;
    }
  }
  return next;
};

const DepositDialog = ({ open, onClose, onSubmit }: Props) => {
  const [mode, setMode] = useState<Mode>("asset");
  const [assetForm, setAssetForm] = useState<DepositFormValues>(() => buildDefaultAssetForm());
  const [institutionForm, setInstitutionForm] = useState<InstitutionFormValues>({ name: "", type: "" as InstitutionFormValues["type"] });
  const [assetErrors, setAssetErrors] = useState<Partial<Record<keyof DepositFormValues, string>>>({});
  const [institutionErrors, setInstitutionErrors] = useState<Partial<Record<keyof InstitutionFormValues, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { currencies } = useCurrencyStore();
  const currencyOptions: { label: string; value: string }[] = currencies.map((currency) => ({
    label: currency.name,
    value: currency.code,
  }));

  useEffect(() => {
    if (open) {
      setMode("asset");
      setAssetForm(buildDefaultAssetForm());
      setInstitutionForm({ name: "", type: "" as InstitutionFormValues["type"] });
      setAssetErrors({});
      setInstitutionErrors({});
      setIsSaving(false);
    }
  }, [open]);

  const handleModeChange = (_: unknown, nextMode: Mode | null) => {
    if (!nextMode) return;
    setMode(nextMode);
    setAssetErrors({});
    setInstitutionErrors({});
  };

  const handleAssetChange = (key: keyof DepositFormValues, value: string | number | null) => {
    setAssetForm((prev) => ({
      ...prev,
      [key]: (typeof prev[key] === "number" ? Number(value ?? 0) : (value ?? "")) as DepositFormValues[typeof key],
    }));
    setAssetErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleInstitutionChange = (key: keyof InstitutionFormValues, value: string) => {
    setInstitutionForm((prev) => ({
      ...prev,
      [key]: value as InstitutionFormValues[typeof key],
    }));
    setInstitutionErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (mode === "asset") {
      const parsed = depositSchema.safeParse({ ...assetForm, name: assetForm.name.trim() });
      if (!parsed.success) {
        setAssetErrors(buildErrors<DepositFormValues>(parsed.error));
        return;
      }
      setAssetErrors({});

      setIsSaving(true);
      try {
        await onSubmit({ mode: "asset", asset: parsed.data });
        enqueueSnackbar('资产添加成功！', { severity: 'success' });
        onClose();
      } catch (error) {
        console.error("提交资产失败", error);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const parsedInstitution = institutionSchema.safeParse({ name: institutionForm.name.trim(), type: institutionForm.type });
    if (!parsedInstitution.success) {
      setInstitutionErrors(buildErrors<InstitutionFormValues>(parsedInstitution.error));
      return;
    }
    setInstitutionErrors({});

    setIsSaving(true);
    try {
      const created = await onSubmit({ mode: "institution", institution: parsedInstitution.data });
      if (created?.id) {
        setAssetForm((prev) => ({ ...prev, institutionId: created.id }));
      }
      enqueueSnackbar('机构添加成功！', { severity: 'success' });
      onClose();
    } catch (error) {
      console.error("提交机构失败", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>新增资产/机构</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} pt={1}>
          <ToggleButtonGroup
            color="primary"
            value={mode}
            exclusive
            onChange={handleModeChange}
            fullWidth
          >
            <ToggleButton value="asset">新增资产</ToggleButton>
            <ToggleButton value="institution">新增机构</ToggleButton>
          </ToggleButtonGroup>

          {mode === "asset" ? (
            <Stack spacing={2}>
              <TextField
                label="资产名称"
                value={assetForm.name}
                onChange={(e) => handleAssetChange("name", e.target.value)}
                fullWidth
                required
                error={!!assetErrors.name}
                helperText={assetErrors.name}
              />
              <TextField
                label="资产类型"
                select
                value={assetForm.type}
                onChange={(e) => handleAssetChange("type", e.target.value)}
                fullWidth
                required
                error={!!assetErrors.type}
                helperText={assetErrors.type}
              >
                {assetTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <InstitutionSelect
                value={assetForm.institutionId || null}
                onChange={(id) => handleAssetChange("institutionId", id)}
                required
                error={!!assetErrors.institutionId}
                helperText={assetErrors.institutionId}
              />
              <TextField
                label="币种"
                select
                value={assetForm.currency}
                onChange={(e) => handleAssetChange("currency", e.target.value)}
                fullWidth
                required
                error={!!assetErrors.currency}
                helperText={assetErrors.currency}
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
                value={assetForm.riskLevel}
                onChange={(e) => handleAssetChange("riskLevel", e.target.value)}
                fullWidth
                required
                error={!!assetErrors.riskLevel}
                helperText={assetErrors.riskLevel}
              >
                {riskLevels.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                label="机构名称"
                value={institutionForm.name}
                onChange={(e) => handleInstitutionChange("name", e.target.value)}
                fullWidth
                required
                error={!!institutionErrors.name}
                helperText={institutionErrors.name}
              />
              <TextField
                label="机构类型"
                select
                value={institutionForm.type}
                onChange={(e) => handleInstitutionChange("type", e.target.value)}
                fullWidth
                required
                placeholder="如：银行、券商、基金公司等"
                error={!!institutionErrors.type}
                helperText={institutionErrors.type}
              >
                {institutionTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>取消</Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : undefined}>
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepositDialog;
