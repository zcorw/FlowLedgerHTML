import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Delete, Edit, Save } from "@mui/icons-material";
import dayjs from "dayjs";
import type { Category, ExpenseCreate, ReceiptRecognitionResult, ReceiptRecognitionItem } from "@/api/expense";
import { enqueueSnackbar } from "@/store/snackbar";

type Props = {
  open: boolean;
  onClose: () => void;
  items: ReceiptRecognitionResult;
  categories: Category[];
  currencyOptions: { label: string; value: string, scale: number }[];
  defaultCurrency?: string;
  onSubmit: (items: ExpenseCreate[]) => Promise<void> | void;
};

type RowState = {
  id: string;
  name: string;
  amount: string;
  categoryId: number;
  editing: boolean;
};

type SharedForm = {
  merchant: string;
  occurredAt: string;
  currency: string;
};

const normalizeRows = (items: ReceiptRecognitionItem[], categories: Category[], scale: number): RowState[] => {
  return items.map((item, index) => {
    const category = categories.find((category) => category.name === item.type);
    const amount = item.amount || 0;
    return {
      id: String(index + 1),
      name: item.name,
      amount: String(amount),
      tax: Number((item.amount * (category?.tax || 0)).toFixed(scale)),
      categoryId: categories.find((category) => category.name === item.type)?.id || 0,
      editing: false,
    }
  });
};

const buildSharedForm = (items: Omit<ReceiptRecognitionResult, "items">, fallbackCurrency: string): SharedForm => {
  const first = items;
  return {
    merchant: first?.merchant || "",
    occurredAt: first?.occurred_at ? dayjs(first.occurred_at).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
    currency: fallbackCurrency,
  };
};

const ExpenseReceiptDialog = ({
  open,
  onClose,
  items,
  categories,
  currencyOptions,
  defaultCurrency,
  onSubmit,
}: Props) => {
  const fallbackCurrency = defaultCurrency || currencyOptions[0]?.value || "CNY";
  const [rows, setRows] = useState<RowState[]>([]);
  const [sharedForm, setSharedForm] = useState<SharedForm>(buildSharedForm({ merchant: "", occurred_at: "" }, fallbackCurrency));
  const [errors, setErrors] = useState<Record<string, Partial<Record<keyof RowState | keyof SharedForm, string>>>>({});
  const [saving, setSaving] = useState(false);
  const [isTax, setIsTax] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const categoryMap = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, item) => {
      acc[String(item.id)] = item.name;
      return acc;
    }, {});
  }, [categories]);

  const categoryOptions = useMemo(
    () => [{ label: "未分类", value: "" }, ...categories.map((item) => ({ label: item.name, value: String(item.id) }))],
    [categories]
  );

  const totalAmount = useMemo(() => rows.reduce((total, item) => total + Number(item.amount), 0), [rows]);

  const taxAmount = useMemo(() => rows.reduce((total, item) => {
    const scale = currencyOptions.find((option) => option.value == sharedForm.currency)!.scale;
    const tax = categories.find((category) => category.id == item.categoryId)?.tax || 0;
    return total + Number((+item.amount * tax).toFixed(scale));
  }, 0), [rows, sharedForm]);

  useEffect(() => {
    if (open) {
      const scale = currencyOptions.find((option) => option.value === sharedForm.currency)!.scale;
      setRows(normalizeRows(items.items, categories, scale));
      setSharedForm(buildSharedForm(items, fallbackCurrency));
      setErrors({});
      setSaving(false);
    }
  }, [open, items, fallbackCurrency]);

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
    }
  };

  const updateShared = (key: keyof SharedForm, value: string) => {
    setSharedForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, shared: { ...prev.shared, [key]: undefined } }));
  };

  const toggleEdit = (id: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, editing: !row.editing } : row)));
  };

  const updateRow = (id: string, key: keyof RowState, value: string | boolean) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const _row = { ...row, [key]: value };
          return _row;
        }
        return row;
      })
    );
    setErrors((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: undefined },
    }));
  };

  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, Partial<Record<keyof RowState | keyof SharedForm, string>>> = {};

    if (!sharedForm.currency) {
      nextErrors.shared = { ...(nextErrors.shared || {}), currency: "请选择币种" };
    }
    if (!sharedForm.occurredAt) {
      nextErrors.shared = { ...(nextErrors.shared || {}), occurredAt: "请选择日期" };
    }

    rows.forEach((row) => {
      const rowErrors: Partial<Record<keyof RowState, string>> = {};
      if (!row.name.trim()) {
        rowErrors.name = "请输入项目名称";
      }
      if (!row.amount.trim()) {
        rowErrors.amount = "请输入金额";
      } else if (!/^\d+(\.\d{1,6})?$/.test(row.amount.trim())) {
        rowErrors.amount = "金额格式不正确";
      }
      if (Object.keys(rowErrors).length > 0) {
        nextErrors[row.id] = rowErrors;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!validate()) return;

    const payload: ExpenseCreate[] = rows.map((row) => ({
      name: row.name.trim(),
      amount: row.amount.trim(),
      currency: sharedForm.currency,
      category_id: row.categoryId ? Number(row.categoryId) : null,
      merchant: sharedForm.merchant.trim() || null,
      paid_account_id: null,
      occurred_at: dayjs(sharedForm.occurredAt).startOf("day").toISOString(),
      source_ref: null,
      note: row.name.trim() || null,
    }));

    setSaving(true);
    try {
      await onSubmit(payload);
      enqueueSnackbar("已批量添加消费记录", { severity: "success" });
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "提交失败，请稍后重试";
      enqueueSnackbar(message, { severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const sharedErrors = errors.shared || {};

  return (
    <Drawer anchor="right" open={open} onClose={saving ? undefined : onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 560 }, p: 3, height: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">小票识别结果</Typography>
          <Typography variant="body2" color="text.secondary">
            请确认识别内容，可手动修改后批量入账
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Typography variant="subtitle2">本次消费信息</Typography>
          <TextField
            label="商家"
            value={sharedForm.merchant}
            onChange={(e) => updateShared("merchant", e.target.value)}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="消费日期"
              type="date"
              value={sharedForm.occurredAt}
              onChange={(e) => updateShared("occurredAt", e.target.value)}
              error={!!sharedErrors.occurredAt}
              helperText={sharedErrors.occurredAt}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputRef={dateInputRef}
              inputProps={{
                onClick: openDatePicker,
                onFocus: openDatePicker,
              }}
            />
            <TextField
              label="币种"
              select
              value={sharedForm.currency}
              onChange={(e) => updateShared("currency", e.target.value)}
              error={!!sharedErrors.currency}
              helperText={sharedErrors.currency}
              fullWidth
            >
              {currencyOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        <Stack spacing={2} sx={{ flex: 1, overflowY: "auto" }}>
          <Typography variant="subtitle2">支出明细</Typography>
          {rows.length === 0 ? (
            <Typography color="text.secondary">暂无识别到的支出项目</Typography>
          ) : (
            rows.map((row) => (
              <Box
                key={row.id}
                sx={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">
                    {row.name || "未命名项目"}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => toggleEdit(row.id)}>
                      {row.editing ? <Save fontSize="small" /> : <Edit fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteRow(row.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                {row.editing ? (
                  <Stack spacing={1.5}>
                    <TextField
                      label="项目名称"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, "name", e.target.value)}
                      error={!!errors[row.id]?.name}
                      helperText={errors[row.id]?.name}
                      size="small"
                      fullWidth
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="金额"
                        value={row.amount}
                        onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                        error={!!errors[row.id]?.amount}
                        helperText={errors[row.id]?.amount}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label="类型"
                        select
                        value={row.categoryId}
                        onChange={(e) => updateRow(row.id, "categoryId", e.target.value)}
                        size="small"
                        fullWidth
                      >
                        {categoryOptions.map((option) => (
                          <MenuItem key={option.value || "uncategorized"} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={2}>
                    <Typography variant="body2">金额：{row.amount || "--"}</Typography>
                    <Typography variant="body2">类型：{categoryMap[row.categoryId] || "未分类"}</Typography>
                  </Stack>
                )}
              </Box>
            ))
          )}
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Stack spacing={1}>
            <FormControlLabel control={<Checkbox checked={isTax} onChange={(e) => setIsTax(e.target.checked)} />} label="含税" />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2">税:</Typography>
            <Typography variant="body2">{taxAmount}</Typography>
            <Typography variant="subtitle2">总计:</Typography>
            <Typography variant="body2">{!isTax ? totalAmount + taxAmount : totalAmount}</Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onClose} disabled={saving}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || rows.length === 0}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {saving ? "提交中..." : "确认入账"}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default ExpenseReceiptDialog;
