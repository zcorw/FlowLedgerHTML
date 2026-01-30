import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
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
} from "@mui/material";
import InstitutionSelect from "../InstitutionSelect";
import dayjs from "dayjs";
import { importExpenseReceipt } from "@/api/expense";
import type { Category, ExpenseCreate } from "@/api/expense";
import { enqueueSnackbar } from "@/store/snackbar";
import { expenseSchema, type ExpenseFormValues } from "@/validation/expense";

export type ExpenseDialogPayload = ExpenseCreate;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ExpenseDialogPayload) => Promise<void> | void;
  categories: Category[];
  currencyOptions: { label: string; value: string }[];
  defaultCurrency?: string;
};

const buildDefaultForm = (currency: string): ExpenseFormValues => ({
  name: "",
  amount: "",
  currency,
  categoryId: "",
  merchant: "",
  occurredAt: dayjs().format("YYYY-MM-DD"),
  note: "",
  paidAccountId: null,
  fileId: null,
});

const ExpenseDialog = ({ open, onClose, onSubmit, categories, currencyOptions, defaultCurrency }: Props) => {
  const fallbackCurrency = defaultCurrency || currencyOptions[0]?.value || "CNY";
  const [form, setForm] = useState<ExpenseFormValues>(() => buildDefaultForm(fallbackCurrency));
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormValues, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);

  const categoryItems = useMemo(
    () => [{ label: "未分类", value: "" }, ...categories.map((item) => ({ label: item.name, value: String(item.id) }))],
    [categories]
  );

  useEffect(() => {
    if (open) {
      setForm(buildDefaultForm(fallbackCurrency));
      setErrors({});
      setIsSaving(false);
    }
  }, [open, fallbackCurrency]);

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
    }
  };

  const handleChange = (key: keyof ExpenseFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const parsed = expenseSchema.safeParse({
      name: form.name.trim(),
      amount: form.amount.trim(),
      currency: form.currency,
      categoryId: form.categoryId || undefined,
      merchant: form.merchant || undefined,
      occurredAt: form.occurredAt,
      note: form.note || undefined,
    });
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ExpenseFormValues, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ExpenseFormValues;
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      });
      setErrors(nextErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!validate()) return;

    const payload: ExpenseDialogPayload = {
      name: form.name.trim(),
      amount: form.amount.trim(),
      currency: form.currency,
      category_id: form.categoryId ? Number(form.categoryId) : null,
      merchant: form.merchant?.trim() || null,
      paid_account_id: form.paidAccountId || null,
      occurred_at: dayjs(form.occurredAt).startOf("day").toISOString(),
      source_ref: null,
      note: form.note?.trim() || null,
      file_id: form.fileId || null,
    };

    setIsSaving(true);
    try {
      await onSubmit(payload);
      enqueueSnackbar("消费记录已添加", { severity: "success" });
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "提交失败，请稍后重试";
      enqueueSnackbar(message, { severity: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReceiptClick = () => {
    receiptInputRef.current?.click();
  };

  const handleReceiptFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const {data: result, file_id } = await importExpenseReceipt(file);
      setForm((prev) => ({ 
        ...prev, 
        name: result.name,
        amount: String(result.amount),
        merchant: result.merchant,
        occurredAt: dayjs(result.occurred_at).format("YYYY-MM-DD"),
        categoryId: String(categories.find((category) => category.name === result.type)?.id || ""),
        fileId: file_id,
      }));
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "小票识别失败";
      enqueueSnackbar(message, { severity: "error" });
    } finally {
      setUploadingReceipt(false);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <span>添加消费记录</span>
          <Button onClick={handleReceiptClick} disabled={uploadingReceipt}>{ uploadingReceipt ? "识别中..." : "识别小票" }</Button>
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleReceiptFile}
          />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} pt={1}>
          <TextField
            label="消费名称"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />
          <TextField
            label="金额"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            placeholder="如：86.00"
            required
            error={!!errors.amount}
            helperText={errors.amount}
            fullWidth
          />
          <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="币种"
            select
            value={form.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            required
            error={!!errors.currency}
            helperText={errors.currency}
            fullWidth
          >
            {currencyOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <InstitutionSelect value={form.paidAccountId} onChange={(id) => handleChange("paidAccountId", String(id))} />
          </Stack>
          <TextField
            label="分类"
            select
            value={form.categoryId}
            onChange={(e) => handleChange("categoryId", e.target.value)}
            fullWidth
          >
            {categoryItems.map((option) => (
              <MenuItem key={option.value || "uncategorized"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="商户"
            value={form.merchant}
            onChange={(e) => handleChange("merchant", e.target.value)}
            placeholder="如：星巴克"
            fullWidth
          />
          <TextField
            label="发生时间"
            type="date"
            value={form.occurredAt}
            onChange={(e) => handleChange("occurredAt", e.target.value)}
            required
            error={!!errors.occurredAt}
            helperText={errors.occurredAt}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputRef={dateInputRef}
            inputProps={{
              onClick: openDatePicker,
              onFocus: openDatePicker,
            }}
          />
          <TextField
            label="备注"
            value={form.note}
            onChange={(e) => handleChange("note", e.target.value)}
            placeholder="如：午餐"
            fullWidth
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

export default ExpenseDialog;
