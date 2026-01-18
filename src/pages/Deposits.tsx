import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { AssetDetailsCard, DepositsTotalCard, InstitutionDetailsCard } from "@/components/Cards";
import DepositDialog, { type DepositSubmitPayload } from "@/components/Dialogs/DepositDialog";
import {
  createInstitution,
  createProduct,
  createBalance,
  importDeposit,
  listInstitutions,
  listProducts,
  deleteInstitution,
  deleteProduct,
  createLatestBalance,
  type Institution,
  type InstitutionType,
  type ListInstitutionsParams,
  type ListProductsParams,
  type Product,
  type ProductCreate,
  type ProductType,
  type LatestBalanceBatchParams,
} from "@/api/deposits";
import TabButtons from "@/components/TabButtons";
import type { AssetRow } from "@/components/Cards/AssetDetailsCard";
import type { FilterItem } from "@/components/Tables/TableFilter";
import type { InstitutionRow } from "@/components/Cards/InstitutionDetailsCard";
import useCurrencyStore, { selectCurrencies } from "@/store/currency";
import { enqueueSnackbar } from "@/store/snackbar";
import ConfirmDialog from "@/components/ConfirmDialog";
import BalanceBulkDrawer, { type BalanceBulkDrawerProps } from "@/components/BalanceBulkDrawer";
import AssetBalanceSnapshotDrawer from "@/components/Drawers/AssetBalanceSnapshotDrawer";

const tabs = [
  { label: "资产", value: "asset" },
  { label: "机构", value: "institution" },
];

const rowsPerPage = 5;

const filterItems: FilterItem[] = [
  {
    key: "product_type",
    label: "类型",
    type: "menu",
    options: [
      { label: "全部", value: "all" },
      { label: "存款", value: "deposit" },
      { label: "理财/投资", value: "investment" },
      { label: "券商/证券", value: "securities" },
    ],
  },
  {
    key: "keyword",
    label: "关键字",
    type: "input",
  },
];

const institutionFilterItems: FilterItem[] = [
  {
    key: "type",
    label: "类型",
    type: "menu",
    options: [
      { label: "全部", value: "all" },
      { label: "银行", value: "bank" },
      { label: "券商", value: "broker" },
      { label: "其他", value: "other" },
    ],
  },
  {
    key: "keyword",
    label: "关键字",
    type: "input",
  },
];

const DepositsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState<string>("asset");
  const [tableFilter, setTableFilter] = useState<{
    product_type: ProductType | "all";
    currency: string;
    institution_id: number | "all";
    keyword: string;
  }>({
    product_type: "all",
    currency: "all",
    institution_id: "all",
    keyword: "",
  });
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [institutionPage, setInstitutionPage] = useState(1);
  const [institutionPageCount, setInstitutionPageCount] = useState(1);
  const [institutionRows, setInstitutionRows] = useState<InstitutionRow[]>([]);
  const [institutionFilter, setInstitutionFilter] = useState({
    type: "all",
    keyword: "",
  });
  const [importing, setImporting] = useState(false);
  const [institutionOptions, setInstitutionOptions] = useState<{ label: string; value: number }[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    type: "asset" | "institution";
    id?: number;
    name?: string;
  }>({ open: false, type: "asset" });
  const [deleting, setDeleting] = useState(false);
  const [bulkDrawer, setBulkDrawer] = useState<{
    open: boolean;
    institutionId?: number;
    institutionName?: string;
  }>({
    open: false,
  });
  const [snapshotDrawer, setSnapshotDrawer] = useState<{
    open: boolean;
    asset?: AssetRow;
  }>({ open: false });

  const currencyMap = useCurrencyStore(selectCurrencies);

  const assetFilters = useMemo<FilterItem[]>(() => {
    const item: FilterItem = {
      key: "currency",
      label: "币种",
      type: "menu",
      options: [
        { label: "全部", value: "all" },
        ...currencyMap.map((currency) => ({ label: currency.code, value: currency.code })),
      ],
    };
    const institutionItem: FilterItem = {
      key: "institution_id",
      label: "机构",
      type: "menu",
      options: [
        { label: "全部", value: "all" },
        ...institutionOptions.map((opt) => ({ label: opt.label, value: opt.value })),
      ],
    };
    return [
      ...filterItems.slice(0, -1),
      institutionItem,
      item,
      ...filterItems.slice(-1),
    ];
  }, [currencyMap, institutionOptions]);

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleSubmit = async (payload: DepositSubmitPayload) => {
    if (payload.mode === "institution") {
      return createInstitution(payload.institution);
    } else {
      const productData: ProductCreate = {
        name: payload.asset.name,
        product_type: payload.asset.type,
        institution_id: payload.asset.institutionId,
        currency: payload.asset.currency,
        risk_level: payload.asset.riskLevel,
      };
      return createProduct(productData);
    }
  };

  const formatAmount = (currency: string, amount?: string | null) => {
    if (!amount) return "--";
    const num = Number(amount);
    if (Number.isNaN(num)) return amount;
    try {
      return new Intl.NumberFormat("zh-CN", { style: "currency", currency }).format(num);
    } catch {
      return amount;
    }
  };

  const onFilterChange = (key: string, value: string | number) => {
    setTableFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const onInstitutionFilterChange = (key: string, value: string | number) => {
    setInstitutionFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
    setInstitutionPage(1);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await importDeposit(file);
      enqueueSnackbar("导入任务已提交，请稍后刷新列表", { severity: "success" });
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "导入失败，请稍后重试";
      enqueueSnackbar(message, { severity: "error" });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const handleBulkClose = () => {
    setBulkDrawer({ open: false, institutionId: undefined, institutionName: undefined });
    setRefreshKey((prev) => prev + 1);
  };

  const handleBulkOpenInstitution = async (row: InstitutionRow) => {
    // 先打开抽屉，随后加载 active 资产
    setBulkDrawer({
      open: true,
      institutionId: Number(row.id),
      institutionName: row.name,
    });
  };

  const handleOpenSnapshot = (row: AssetRow) => {
    setSnapshotDrawer({ open: true, asset: row });
  };

  const handleCloseSnapshot = (hasChanges: boolean) => {
    setSnapshotDrawer({ open: false, asset: undefined });
    if (hasChanges) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleBulkSubmit: BalanceBulkDrawerProps["onSubmit"] = async (balances) => {
    const payload: LatestBalanceBatchParams = {
      items: balances.map((balance) => ({
        product_id: balance.productId,
        amount: balance.amount,
        as_of: new Date().toISOString(),
      }))
    };
    try {
      const result = await createLatestBalance(Number(bulkDrawer.institutionId), payload);
      enqueueSnackbar(`共${result.total}条数据，${result.created}条新增，${result.failed}条失败`, { severity: "success" });
      handleBulkClose();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "更新失败，请稍后重试";
      enqueueSnackbar(message, { severity: "error" });
    }
  };

  const requestDeleteAsset = (row: AssetRow) => {
    setConfirmState({ open: true, type: "asset", id: row.id, name: row.account });
  };

  const requestDeleteInstitution = (row: InstitutionRow) => {
    setConfirmState({ open: true, type: "institution", id: row.id, name: row.name });
  };

  const handleCloseConfirm = () => {
    if (deleting) return;
    setConfirmState((prev) => ({ ...prev, open: false }));
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.id) return;
    setDeleting(true);
    try {
      if (confirmState.type === "asset") {
        await deleteProduct(Number(confirmState.id));
        enqueueSnackbar("资产删除成功", { severity: "success" });
      } else {
        await deleteInstitution(Number(confirmState.id));
        enqueueSnackbar("机构删除成功", { severity: "success" });
      }
      setRefreshKey((prev) => prev + 1);
      setConfirmState((prev) => ({ ...prev, open: false }));
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        (confirmState.type === "asset" ? "资产删除失败，请稍后重试" : "机构删除失败，请稍后重试");
      enqueueSnackbar(message, { severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (tabValue !== "asset") return;

    const fetchProducts = async () => {
      const params: ListProductsParams = {
        page,
        page_size: rowsPerPage,
        currency: tableFilter.currency !== "all" ? tableFilter.currency : undefined,
        product_type: tableFilter.product_type !== "all" ? tableFilter.product_type : undefined,
        institution_id: tableFilter.institution_id !== "all" ? Number(tableFilter.institution_id) : undefined,
      };

      const res = await listProducts(params);

      const keyword = tableFilter.keyword.trim().toLowerCase();

      const mapped = res.data
        .filter((product: Product) => {
          if (!keyword) return true;
          return product.name.toLowerCase().includes(keyword);
        })
        .map((product: Product) => ({
          id: product.id,
          institution: product.institution_name,
          account: product.name,
          currency: product.currency,
          balance: formatAmount(product.currency, product.amount),
          updatedAt: product.amount_updated_at ? dayjs(product.amount_updated_at).format("YYYY-MM-DD") : "--",
          status: product.status,
        }));

      setRows(mapped);

      const total = res.total ?? mapped.length;
      setPageCount(Math.max(1, Math.ceil(total / rowsPerPage)));
    };

    fetchProducts();
  }, [
    page,
    tableFilter.product_type,
    tableFilter.currency,
    tableFilter.institution_id,
    tableFilter.keyword,
    tabValue,
    refreshKey,
  ]);

  useEffect(() => {
    if (tabValue !== "institution") return;

    const fetchInstitutions = async () => {
      const params: ListInstitutionsParams = {
        page: institutionPage,
        page_size: rowsPerPage,
        type: institutionFilter.type !== "all" ? (institutionFilter.type as InstitutionType) : undefined,
        name: institutionFilter.keyword || undefined,
      };

      const res = await listInstitutions(params);

      const mapped = res.data.map((inst: Institution) => ({
        id: inst.id,
        name: inst.name,
        type: inst.type,
        assetNum: inst.product_number,
        status: inst.status,
      }));

      setInstitutionRows(mapped);

      const total = res.total ?? mapped.length;
      setInstitutionPageCount(Math.max(1, Math.ceil(total / rowsPerPage)));
    };

    fetchInstitutions();
  }, [tabValue, institutionPage, institutionFilter.keyword, institutionFilter.type, refreshKey]);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await listInstitutions({ page: 1, page_size: 200 });
        setInstitutionOptions(res.data.map((inst) => ({ label: inst.name, value: inst.id })));
      } catch (error: any) {
        console.error("Failed to fetch institutions for filter", error);
      }
    };
    loadInstitutions();
  }, []);

  return (
    <Box pt={6}>
      <Stack spacing={3}>
        <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" style={{ fontWeight: 700 }}>
            存款管理
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="primary" onClick={handleOpenDialog}>
              新增资产/机构
            </Button>
            <Button variant="contained" color="primary" onClick={handleImportClick} disabled={importing}>
              {importing ? "导入中..." : "批量导入"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={handleImportFile}
            />
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <DepositsTotalCard amount={1000} date="2023-06" changeAmount={500} />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <TabButtons value={tabValue} onChange={(value) => setTabValue(value as string)} options={tabs} />
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          {tabValue === "asset" && (
            <AssetDetailsCard
              title="资产明细"
              filters={assetFilters}
              selectedFilters={tableFilter}
              onFilterChange={onFilterChange}
              onDelete={requestDeleteAsset}
              onSnapshot={handleOpenSnapshot}
              rows={rows}
              page={page}
              pageCount={pageCount}
              onPageChange={(p) => setPage(p)}
            />
          )}
          {tabValue === "institution" && (
            <InstitutionDetailsCard
              title="机构列表"
              filters={institutionFilterItems}
              selectedFilters={institutionFilter}
              onFilterChange={onInstitutionFilterChange}
              onBulkUpdate={handleBulkOpenInstitution}
              onDelete={requestDeleteInstitution}
              rows={institutionRows}
              page={institutionPage}
              pageCount={institutionPageCount}
              onPageChange={(p) => setInstitutionPage(p)}
            />
          )}
        </Grid>

        <DepositDialog open={dialogOpen} onClose={handleCloseDialog} onSubmit={handleSubmit} />
        <ConfirmDialog
          open={confirmState.open}
          title="确认删除"
          description={`确认删除${confirmState.type === "asset" ? "资产" : "机构"}${confirmState.name ? `“${confirmState.name}”` : ""}？`}
          onCancel={handleCloseConfirm}
          onConfirm={handleConfirmDelete}
          confirmText="确认删除"
          loading={deleting}
        />
        <BalanceBulkDrawer
          open={bulkDrawer.open}
          onClose={handleBulkClose}
          onSubmit={handleBulkSubmit}
          institutionName={bulkDrawer.institutionName}
          institutionId={bulkDrawer.institutionId}
        />
        <AssetBalanceSnapshotDrawer
          open={snapshotDrawer.open}
          onClose={handleCloseSnapshot}
          asset={snapshotDrawer.asset}
        />
      </Stack>
    </Box>
  );
};

export default DepositsPage;
