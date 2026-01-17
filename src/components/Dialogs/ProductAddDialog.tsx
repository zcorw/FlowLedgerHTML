import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { depositSchema, type DepositFormValues } from "@/validation/deposit";
import useCurrencyStore from "@/store/currency";
import AssetFormFields from "./AssetFormFields";
import { buildErrors } from "./dialogUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  institutionId: number;
  institutionName?: string;
  onSubmit: (payload: DepositFormValues) => Promise<void> | void;
};

const buildDefaultForm = (institutionId: number): DepositFormValues => ({
  name: "",
  type: depositSchema.shape.type.options[0],
  institutionId,
  currency: "",
  riskLevel: depositSchema.shape.riskLevel.options[0],
});

const ProductAddDialog = ({
  open,
  onClose,
  institutionId,
  institutionName,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<DepositFormValues>(() => buildDefaultForm(institutionId));
  const [errors, setErrors] = useState<Partial<Record<keyof DepositFormValues, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { currencies } = useCurrencyStore();
  const currencyOptions: { label: string; value: string }[] = currencies.map((currency) => ({
    label: currency.name,
    value: currency.code,
  }));

  useEffect(() => {
    if (open) {
      setForm(buildDefaultForm(institutionId));
      setErrors({});
      setIsSaving(false);
    }
  }, [open, institutionId]);

  const handleChange = (key: keyof DepositFormValues, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value as DepositFormValues[typeof key],
    }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSave = async () => {
    if (isSaving) return;

    const parsed = depositSchema.safeParse({
      ...form,
      name: form.name.trim(),
      institutionId,
    });
    if (!parsed.success) {
      setErrors(buildErrors<DepositFormValues>(parsed.error));
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      await onSubmit(parsed.data);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>新增资产</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} pt={1}>
          {institutionName && (
            <Typography variant="body2" color="text.secondary">
              机构：{institutionName}
            </Typography>
          )}
          <AssetFormFields
            form={form}
            errors={errors}
            currencyOptions={currencyOptions}
            onChange={handleChange}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          取消
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductAddDialog;
