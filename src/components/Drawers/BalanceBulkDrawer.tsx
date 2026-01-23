import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { meta as statusMeta } from "../StatusBadge";
import { createProduct, listProducts, updateProductStatus, type Product, type ProductCreate } from "@/api/deposits";
import { useEffect } from "react";
import { balanceListSchema, balanceSchema } from "@/validation/deposit";
import useCurrencyStore, { selectCurrencyMap } from "@/store/currency";
import { enqueueSnackbar } from "@/store/snackbar"
import { Add } from "@mui/icons-material";
import ProductAddDialog from "@/components/Dialogs/ProductAddDialog";
import type { ProductStatus } from "@/api/types";

export type BalanceBulkDrawerProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Receives validated amounts (decimal strings, up to 6 decimals).
   */
  onSubmit: (balances: BalanceSubmitItem[]) => Promise<void> | void;
  institutionName?: string;
  institutionId?: number;
};

type BalanceSubmitItem = {
  productId: number;
  amount: string;
};

type TableRow = {
  id: number;
  name: string;
  amount: string;
  currency: string;
  status: string;
};

const BalanceBulkDrawer = ({
  open,
  onClose,
  onSubmit,
  institutionName,
  institutionId,
}: BalanceBulkDrawerProps) => {
  const [row, setRows] = useState<TableRow[]>([]);
  const [error, setError] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const currencyMap = useCurrencyStore(selectCurrencyMap);

  const handleSubmit = async () => {
    const parsed = balanceListSchema.safeParse(
      row.map((r) => ({ status: r.status, amount: r.amount }))
    );
    if (!parsed.success) {
      const nextErrors: string[] = [];
      parsed.error.issues.forEach((issue) => {
        const idx = issue.path[0] as number;
        if (!nextErrors[idx]) {
          nextErrors[idx] = issue.message;
        }
      });
      setError(nextErrors);
      return;
    }
    try {
      setLoading(true);
      await onSubmit(
        row.filter((r) => r.status === "active").map((r) => ({
          productId: r.id,
          amount: r.amount,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRows = async () => {
    if (!institutionId) return;
    const res = await listProducts({ institution_id: institutionId });
    setRows(res.data.map((prod: Product) => {
      const r = row.find((r) => r.id === prod.id);
      return {
        id: prod.id,
        name: prod.name,
        amount: r?.amount || "",
        currency: prod.currency,
        status: prod.status,
      }
    }));
  };

  useEffect(() => {
    if (!open) {
      setRows([]);
      setError([]);
      return;
    }
    fetchRows().catch((error) => {
      enqueueSnackbar((error as Error).message, { severity: "error" });
    });
  }, [open, institutionId]);

  const setAmount = (index: number, value: string) => {
    const validDate = { status: 'active', amount: value };
    const parsed = balanceSchema.safeParse(validDate);
    const newRows = [...row];
    if (parsed.success) {
      newRows[index].amount = value;
      setError((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
    } else {
      setError((prev) => {
        const next = [...prev];
        next[index] = parsed.error.issues[0].message;
        return next;
      });
    }
    newRows[index].amount = value;

    setRows(newRows);
  };

  const handleUpdateStatus = async (index: number, status: ProductStatus) => {
    setLoading(true);
    try {
      await updateProductStatus(row[index].id, { status });
      const newRows = [...row];
      newRows[index].status = status;
      setRows(newRows);
    } catch (error) {
      enqueueSnackbar((error as Error).message, { severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOpen = () => setAddOpen(true);
  const handleAddClose = () => setAddOpen(false);

  const handleAddSubmit = async (payload: ProductCreate) => {
    if (!institutionId) return;
    try {
      setLoading(true);
      await createProduct(payload);
      enqueueSnackbar("资产添加成功！", { severity: "success" });
      await fetchRows();
    } catch (error) {
      const message = (error as Error).message || "资产添加失败，请稍后重试";
      enqueueSnackbar(message, { severity: "error" });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const columns: {
    label: string;
    key: string;
    render: (row: TableRow, index: number) => React.ReactNode;
  }[] = [
      {
        label: "资产名称",
        key: "name",
        render: (r, i) => (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ cursor: "pointer" }}
            onClick={() => handleUpdateStatus(i, r.status === "active" ? "inactive" : "active")}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: statusMeta[r.status].color }} />
            <Typography variant="body2">{r.name}</Typography>
          </Stack>
        ),
      },
      {
        label: "余额",
        key: "amount",
        render: (r, i) => (
          <Stack>
            <TextField
              value={r.amount}
              onChange={(e) => setAmount(i, e.target.value)}
              variant="standard"
              disabled={r.status === "inactive"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {currencyMap[r.currency]?.symbol || r.currency}
                  </InputAdornment>
                ),
              }}
            />
            {error[i] &&
              <Typography variant="caption" color="#f87171">
                {error[i]}
              </Typography>
            }
          </Stack>
        ),
      },
    ];

  return (
    <Drawer anchor="right" open={open} onClose={loading ? undefined : onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 480 }, p: 3, height: "100%", display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="h6">批量更新余额</Typography>
            <Typography variant="body2" color="text.secondary">
              {`机构名称：${institutionName}`}
            </Typography>
          </Stack>
          <IconButton onClick={handleAddOpen}>
            <Add />
          </IconButton>
        </Stack>
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={{ color: 'text.secondary' }}>
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {row.map((r, idx) => (
                  <TableRow key={r.id}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>{col.render(r, idx)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? "提交中..." : "开始提交"}
          </Button>
        </Stack>
        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255, 255, 255, 0.72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={24} />
            </Stack>
          </Box>
        )}
      </Box>
      <ProductAddDialog
        open={addOpen}
        onClose={handleAddClose}
        institutionId={institutionId ?? 0}
        institutionName={institutionName}
        onSubmit={(asset) =>
          handleAddSubmit({
            name: asset.name,
            product_type: asset.type,
            institution_id: institutionId ?? 0,
            currency: asset.currency,
            risk_level: asset.riskLevel,
          })
        }
      />
    </Drawer>
  );
};

export default BalanceBulkDrawer;
