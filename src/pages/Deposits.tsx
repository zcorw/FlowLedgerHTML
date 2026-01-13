import { useEffect, useState, useMemo } from "react";
import { Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { AssetDetailsCard, DepositsTotalCard, InstitutionDetailsCard } from "@/components/Cards/index";
import DepositDialog, { DepositSubmitPayload } from "@/components/Dialogs/DepositDialog";
import {
  createProduct,
  createInstitution,
  listProducts,
  listInstitutions,
  type ProductCreate,
  type ProductType,
  type Product,
  type ListProductsParams,
  type ListInstitutionsParams,
  type Institution,
  type InstitutionType,
} from "@/api/deposits";
import TabButtons from "@/components/TabButtons";
import useCurrencyStore, { selectCurrencies } from "@/store/currency";
import type { AssetRow } from "@/components/Cards/AssetDetailsCard";
import type { FilterItem } from "@/components/Tables/TableFilter";
import type { InstitutionRow } from "@/components/Cards/InstitutionDetailsCard";

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
  const [tableFilter, setTableFilter] = useState<{ product_type: ProductType | "all"; currency: string; keyword: string }>({
    product_type: "all",
    currency: "all",
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

  const currencyMap = useCurrencyStore(selectCurrencies);

  const assetFilters = useMemo<FilterItem[]>(() => {
    const item: FilterItem = {
      key: "currency",
      label: "币种",
      type: "menu",
      options: currencyMap.map((currency) => ({ label: currency.code, value: currency.code })),
    };
    return [
      ...filterItems.slice(0, -1),
      item,
      ...filterItems.slice(-1),
    ];
  }, [currencyMap]);

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

  useEffect(() => {
    if (tabValue !== "asset") return;

    const fetchProducts = async () => {
      const params: ListProductsParams = {
        page,
        page_size: rowsPerPage,
        currency: tableFilter.currency !== "all" ? tableFilter.currency : undefined,
        product_type: tableFilter.product_type !== "all" ? tableFilter.product_type : undefined,
      };

      const res = await listProducts(params);

      const keyword = tableFilter.keyword.trim().toLowerCase();

      const mapped = res.data
        .filter((product: Product) => {
          if (!keyword) return true;
          return product.name.toLowerCase().includes(keyword);
        })
        .map((product: Product) => ({
          id: product.id.toString(),
          institution: product.institution_name,
          account: product.name,
          currency: product.currency,
          balance: formatAmount(product.currency, product.amount),
          updatedAt: product.amount_updated_at ? dayjs(product.amount_updated_at).format("YYYY-MM-DD") : "--",
        }));

      setRows(mapped);

      const total = res.total ?? mapped.length;
      setPageCount(Math.max(1, Math.ceil(total / rowsPerPage)));
    };

    fetchProducts();
  }, [page, tableFilter.product_type, tableFilter.currency, tableFilter.keyword, tabValue]);

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
        id: inst.id.toString(),
        name: inst.name,
        type: inst.type,
        assetNum: inst.product_number,
      }));

      setInstitutionRows(mapped);

      const total = res.total ?? mapped.length;
      setInstitutionPageCount(Math.max(1, Math.ceil(total / rowsPerPage)));
    };

    fetchInstitutions();
  }, [tabValue, institutionPage, institutionFilter.type, institutionFilter.keyword]);

  return (
    <Box pt={6}>
      <Stack spacing={3}>
        <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" style={{ fontWeight: 700 }}>
            存款管理
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleOpenDialog}>
            新增资产/机构
          </Button>
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
              rows={institutionRows}
              page={institutionPage}
              pageCount={institutionPageCount}
              onPageChange={(p) => setInstitutionPage(p)}
            />
          )}
        </Grid>

        <DepositDialog open={dialogOpen} onClose={handleCloseDialog} onSubmit={handleSubmit} />
      </Stack>
    </Box>
  );
};

export default DepositsPage;
