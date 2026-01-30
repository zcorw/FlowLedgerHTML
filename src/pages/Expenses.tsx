import { Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  MonthlySpendingCard,
  DailySpendingCard,
  TopCategoriesCard,
  CategoryRatioCard,
  ExpenseDetailsCard,
} from "@/components/Cards";
import type { ExpenseRow } from "@/components/Cards/ExpenseDetailsCard";
import type { FilterItem } from "@/components/Tables/TableFilter";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExpenseDialog from "@/components/Dialogs/ExpenseDialog";
import ExpenseReceiptDialog from "@/components/Dialogs/ExpenseReceiptDialog";
import {
  createExpense,
  createExpenseBatch,
  deleteExpense,
  importExpenseReceipt,
  listCategories,
  listExpenses,
  type Category,
  type Expense,
  type ExpenseCreate,
  type ExpenseList,
  type ReceiptRecognitionResult,
} from "@/api/expense";
import { getExpenseTotalCompare } from "@/api/custom";
import useCurrencyStore, { selectCurrencies } from "@/store/currency";
import useAuthStore, { selectPreferences } from "@/store/auth";
import { enqueueSnackbar } from "@/store/snackbar";
import useCategoryStore, { selectCategories } from "@/store/expenseCategory";

const rowsPerPage = 6;

const filterItems: FilterItem[] = [
  {
    key: "time",
    label: "时间",
    type: "menu",
    options: [
      { label: "本周", value: "week" },
      { label: "30天", value: "30d" },
      { label: "本月", value: "month" },
      { label: "全部", value: "all" },
    ],
  },
  {
    key: "currency",
    label: "币种",
    type: "menu",
    options: [{ label: "全部", value: "all" }],
  },
  {
    key: "keyword",
    label: "关键字",
    type: "input",
  },
];

const ratioColors = ["#26c6da", "#5c6bc0", "#ffb300", "#8d6e63", "#78909c", "#26a69a"];

const parseAmount = (amount: string | null | undefined) => {
  if (!amount) return 0;
  const value = Number(amount);
  return Number.isFinite(value) ? Math.abs(value) : 0;
};

const parseDecimal = (amount: string | null | undefined) => {
  if (!amount) return 0;
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
};

const buildRange = (period: string) => {
  const now = dayjs();
  if (period === "all") {
    return { from: undefined, to: undefined, days: undefined };
  }
  if (period === "month") {
    const from = now.startOf("month");
    return {
      from: from.startOf("day").toISOString(),
      to: now.endOf("day").toISOString(),
      days: now.diff(from, "day") + 1,
    };
  }
  if (period === "30d") {
    const from = now.subtract(29, "day");
    return { from: from.startOf("day").toISOString(), to: now.endOf("day").toISOString(), days: 30 };
  }
  const from = now.subtract(6, "day");
  return { from: from.startOf("day").toISOString(), to: now.endOf("day").toISOString(), days: 7 };
};

const buildDateRange = (period: string) => {
  const now = dayjs();
  if (period === "month") {
    const from = now.startOf("month");
    return {
      from: from.format("YYYY-MM-DD"),
      to: now.format("YYYY-MM-DD"),
      days: now.diff(from, "day") + 1,
    };
  }
  if (period === "30d") {
    const from = now.subtract(29, "day");
    return { from: from.format("YYYY-MM-DD"), to: now.format("YYYY-MM-DD"), days: 30 };
  }
  const from = now.subtract(6, "day");
  return { from: from.format("YYYY-MM-DD"), to: now.format("YYYY-MM-DD"), days: 7 };
};

const formatCurrencyAmount = (currency: string, amount: number, language?: string) => {
  try {
    return new Intl.NumberFormat(language || "zh-CN", { style: "currency", currency }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
};

const ExpensesPage = () => {
  const [dailyPeriod, setDailyPeriod] = useState("7d");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tableFilter, setTableFilter] = useState({
    time: "month",
    currency: "all",
    keyword: "",
  });
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [dailyChangeRate, setDailyChangeRate] = useState(0);
  const [confirmState, setConfirmState] = useState<{ open: boolean; row?: ExpenseRow }>({ open: false });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptItems, setReceiptItems] = useState<ReceiptRecognitionResult>({ merchant: "", occurred_at: "", items: [] });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);

  const currencies = useCurrencyStore(selectCurrencies);
  const preferences = useAuthStore(selectPreferences);
  const language = preferences?.language as string | undefined;
  const defaultCurrency = preferences?.base_currency as string | undefined;

  const categories = useCategoryStore(selectCategories);

  const categoryMap = useMemo(() => {
    return categories.reduce<Record<number, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [categories]);

  const categoryOptions = useMemo(() => {
    return [
      { label: "全部", value: "all" },
      ...categories.map((category) => ({ label: category.name, value: String(category.id) })),
    ];
  }, [categories]);

  const currencyOptions = useMemo(() => {
    if (!currencies.length) {
      return [
        { label: "全部", value: "all", scale: 0 },
      ];
    }
    return [{ label: "全部", value: "all", scale: 0 }, ...currencies.map((c) => ({ label: c.code, value: c.code, scale: c.scale }))];
  }, [currencies]);

  const tableFilters = useMemo<FilterItem[]>(() => {
    return filterItems.map((item) => {
      if (item.key === "currency") {
        return { ...item, options: currencyOptions };
      }
      return item;
    });
  }, [currencyOptions]);

  const handleFilterChange = (key: string, value: string | number) => {
    setTableFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDeleteRequest = (row: ExpenseRow) => {
    setConfirmState({ open: true, row });
  };

  const handleCloseConfirm = () => {
    if (deleting) return;
    setConfirmState({ open: false, row: undefined });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.row) return;
    setDeleting(true);
    try {
      await deleteExpense(Number(confirmState.row.id));
      enqueueSnackbar("消费删除成功", { severity: "success" });
      setConfirmState({ open: false, row: undefined });
      setPage(1);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "删除失败，请稍后重试";
      enqueueSnackbar(message, { severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const summaryStats = useMemo(() => {
    const total = monthExpenses.reduce((sum, item) => sum + parseAmount(item.amount), 0);

    const categoryTotals = monthExpenses.reduce<Record<string, number>>((acc, item) => {
      const label = item.category_id ? categoryMap[item.category_id] || "未分类" : "未分类";
      acc[label] = (acc[label] || 0) + parseAmount(item.amount);
      return acc;
    }, {});

    const currencyTotals = monthExpenses.reduce<Record<string, number>>((acc, item) => {
      const currency = item.currency || "-";
      acc[currency] = (acc[currency] || 0) + parseAmount(item.amount);
      return acc;
    }, {});

    const toRatioItems = (source: Record<string, number>) => {
      const entries = Object.entries(source).sort((a, b) => b[1] - a[1]);
      return entries.map(([label, value], index) => ({
        label,
        value,
        percent: total ? (value / total) * 100 : 0,
        color: ratioColors[index % ratioColors.length],
      }));
    };

    const categoryRatios = toRatioItems(categoryTotals);
    const currencyRatios = toRatioItems(currencyTotals);

    return {
      total,
      categoryRatios,
      currencyRatios,
    };
  }, [monthExpenses, categoryMap]);

  const topCategoryData = summaryStats.categoryRatios.slice(0, 3).map((item) => ({
    label: item.label,
    percent: item.percent,
    color: item.color,
  }));
  const categoryRatioItems = summaryStats.categoryRatios.slice(0, 5).map((item) => ({
    label: item.label,
    percent: Number(item.percent.toFixed(1)),
  }));
  const currencyRatioItems = summaryStats.currencyRatios.slice(0, 5).map((item) => ({
    label: item.label,
    percent: Number(item.percent.toFixed(1)),
  }));

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const range = buildRange(tableFilter.time);
        const params = {
          page,
          page_size: rowsPerPage,
          from: range.from,
          to: range.to,
        };
        const res: ExpenseList = await listExpenses(params);

        const keyword = tableFilter.keyword.trim().toLowerCase();
        const filtered = res.data.filter((item) => {
          const matchesCurrency = tableFilter.currency === "all" || item.currency === tableFilter.currency;
          const matchesCategory =
            selectedCategory === "all" || String(item.category_id ?? "") === selectedCategory;
          const matchesKeyword = !keyword
            ? true
            : [item.note, item.merchant, item.source_ref].some((field) =>
                field ? field.toLowerCase().includes(keyword) : false
              );
          return matchesCurrency && matchesCategory && matchesKeyword;
        });

        setRows(
          filtered.map((item) => ({
            id: String(item.id),
            date: item.occurred_at ? dayjs(item.occurred_at).format("MM-DD") : "--",
            category: item.category_id ? categoryMap[item.category_id] || "未分类" : "未分类",
            amount: `- ${formatCurrencyAmount(item.currency, parseAmount(item.amount), language)}`,
            currency: item.currency,
            note: item.note || item.merchant || "-",
          }))
        );

        const total = res.total ?? res.data.length;
        setPageCount(Math.max(1, Math.ceil(total / rowsPerPage)));
      } catch (error: any) {
        const message = error?.response?.data?.error?.message || error?.message || "加载消费列表失败";
        enqueueSnackbar(message, { severity: "error" });
      }
    };

    fetchExpenses();
  }, [page, tableFilter.time, tableFilter.currency, tableFilter.keyword, selectedCategory, categoryMap, language, refreshKey]);

  useEffect(() => {
    const fetchMonthlySummary = async () => {
      try {
        const now = dayjs();
        const currentFrom = now.startOf("month");
        const currentTo = now;

        const [currentRes, compareRes] = await Promise.all([
          listExpenses({
            page: 1,
            page_size: 200,
            from: currentFrom.startOf("day").toISOString(),
            to: currentTo.endOf("day").toISOString(),
          }),
          getExpenseTotalCompare({
            from: currentFrom.format("YYYY-MM-DD"),
            to: currentTo.format("YYYY-MM-DD"),
          }),
        ]);

        setMonthExpenses(currentRes.data || []);
        setMonthlyTotal(parseDecimal(compareRes.current_total));
        setLastMonthTotal(parseDecimal(compareRes.previous_total));
      } catch (error) {
        // silent for summary
      }
    };
    fetchMonthlySummary();
  }, [refreshKey]);

  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        const periodKey = dailyPeriod === "7d" ? "week" : dailyPeriod;
        const range = buildDateRange(periodKey);
        if (!range.from || !range.to || !range.days) return;

        const compareRes = await getExpenseTotalCompare({
          from: range.from,
          to: range.to,
        });

        const currentTotal = parseDecimal(compareRes.current_total);
        setDailyAverage(currentTotal / range.days);
        setDailyChangeRate(parseDecimal(compareRes.delta_rate));
      } catch (error) {
        // silent for stats
      }
    };
    fetchDailyStats();
  }, [dailyPeriod, refreshKey]);

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleCreateExpense = async (payload: ExpenseCreate) => {
    await createExpense(payload);
    setRefreshKey((prev) => prev + 1);
    setPage(1);
  };

  const handleReceiptClick = () => {
    receiptInputRef.current?.click();
  };

  const handleReceiptFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const result = await importExpenseReceipt(file);
      console.log("🚀 ~ handleReceiptFile ~ result:", result)
      setReceiptItems(result);
      setReceiptDialogOpen(true);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "小票识别失败";
      enqueueSnackbar(message, { severity: "error" });
    } finally {
      setUploadingReceipt(false);
      event.target.value = "";
    }
  };

  const handleReceiptSubmit = async (items: ExpenseCreate[]) => {
    await createExpenseBatch({ items });
    setReceiptDialogOpen(false);
    setReceiptItems({ merchant: "", occurred_at: "", items: [] });
    setRefreshKey((prev) => prev + 1);
    setPage(1);
  };

  return (
    <Box pt={6}>
      <Stack spacing={3}>
        <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" style={{ fontWeight: 700 }}>
            消费管理
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="primary" onClick={handleReceiptClick} disabled={uploadingReceipt}>
              {uploadingReceipt ? "识别中..." : "小票识别"}
            </Button>
            <Button variant="outlined" color="primary" onClick={handleOpenDialog}>
              快速记一笔
            </Button>
            <Button variant="contained" color="primary">
              导出本月
            </Button>
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleReceiptFile}
            />
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <MonthlySpendingCard amount={monthlyTotal} lastMonthAmount={lastMonthTotal} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DailySpendingCard
              amount={dailyAverage}
              selectPeriod={dailyPeriod}
              changeRate={dailyChangeRate}
              onPeriodChange={setDailyPeriod}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TopCategoriesCard title="主要分类" barData={topCategoryData} />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={6}>
            <CategoryRatioCard title="分类占比" items={categoryRatioItems} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <CategoryRatioCard title="币种占比" items={currencyRatioItems} />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <ExpenseDetailsCard
            title="消费详情"
            filters={tableFilters}
            selectedFilters={tableFilter}
            onFilterChange={handleFilterChange}
            rows={rows}
            page={page}
            pageCount={pageCount}
            onPageChange={(value) => setPage(value)}
            onDelete={handleDeleteRequest}
            chips={categoryOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                clickable
                variant={selectedCategory === option.value ? "filled" : "outlined"}
                color={selectedCategory === option.value ? "primary" : "default"}
                onClick={() => {
                  setSelectedCategory(option.value);
                  setPage(1);
                }}
              />
            ))}
          />
        </Grid>
      </Stack>

      <ConfirmDialog
        open={confirmState.open}
        title="确认删除"
        description={`确认删除消费记录${confirmState.row ? `“${confirmState.row.note ?? ""}”` : ""}？`}
        onCancel={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
        confirmText="确认删除"
        loading={deleting}
      />
      <ExpenseDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreateExpense}
        categories={categories}
        currencyOptions={currencyOptions.filter((opt) => opt.value !== "all")}
        defaultCurrency={defaultCurrency}
      />
      <ExpenseReceiptDialog
        open={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        items={receiptItems}
        categories={categories}
        currencyOptions={currencyOptions.filter((opt) => opt.value !== "all")}
        defaultCurrency={defaultCurrency}
        onSubmit={handleReceiptSubmit}
      />
    </Box>
  );
};

export default ExpensesPage;
