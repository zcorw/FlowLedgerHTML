import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AssetRow } from "@/components/Cards/AssetDetailsCard";
import {
  createBalance,
  deleteBalance,
  listProductBalances,
  updateBalance,
  type Balance,
} from "@/api/deposits";
import { enqueueSnackbar } from "@/store/snackbar";
import ConfirmDialog from "@/components/ConfirmDialog";

type SnapshotRow = {
  id: number;
  date: string;
  amount: string;
};

type Props = {
  open: boolean;
  onClose: (hasChanges: boolean) => void;
  asset?: AssetRow;
};

const pageSize = 10;

const normalizeSnapshots = (rows: SnapshotRow[], limit: number) => {
  return [...rows]
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, limit);
};

const mapBalanceToRow = (balance: Balance): SnapshotRow => ({
  id: balance.id,
  date: dayjs(balance.as_of).format("YYYY-MM-DD"),
  amount: balance.amount,
});

const AssetBalanceSnapshotDrawer = ({ open, onClose, asset }: Props) => {
  const [rows, setRows] = useState<SnapshotRow[]>([]);
  const [allRows, setAllRows] = useState<SnapshotRow[]>([]);
  const [allPage, setAllPage] = useState(1);
  const [allPageCount, setAllPageCount] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<SnapshotRow | null>(null);
  const [isNewDraft, setIsNewDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    row?: SnapshotRow;
    loading: boolean;
  }>({ open: false, loading: false });
  const [hasChanges, setHasChanges] = useState(false);

  const loadLatest = async () => {
    if (!asset?.id) return;
    const res = await listProductBalances(asset.id, { page: 1, page_size: 6 });
    const mapped = res.data.map(mapBalanceToRow);
    setRows(normalizeSnapshots(mapped, 6));
  };

  const loadAllPage = async (page: number) => {
    if (!asset?.id) return;
    setIsLoadingAll(true);
    try {
      const res = await listProductBalances(asset.id, { page, page_size: pageSize });
      const mapped = res.data.map(mapBalanceToRow);
      setAllRows(mapped);
      const total = res.total ?? mapped.length;
      setAllPageCount(Math.max(1, Math.ceil(total / pageSize)));
    } catch (error) {
      enqueueSnackbar((error as Error).message || "获取余额快照失败", { severity: "error" });
      setAllRows([]);
      setAllPageCount(1);
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    if (!open || !asset?.id) return;
    const loadSnapshots = async () => {
      try {
        await loadLatest();
      } catch (error) {
        enqueueSnackbar((error as Error).message || "获取余额快照失败", { severity: "error" });
        setRows([]);
      } finally {
        setEditingId(null);
        setDraft(null);
        setIsNewDraft(false);
        setIsSaving(false);
        setDeleteState({ open: false, row: undefined, loading: false });
        setHasChanges(false);
        setShowAll(false);
        setAllRows([]);
        setAllPage(1);
        setAllPageCount(1);
      }
    };
    loadSnapshots();
  }, [open, asset?.id]);

  const handleAdd = () => {
    if (isSaving) return;
    const next: SnapshotRow = {
      id: Date.now(),
      date: dayjs().format("YYYY-MM-DD"),
      amount: "",
    };
    setEditingId(next.id);
    setDraft(next);
    setIsNewDraft(true);
  };

  const handleEdit = (row: SnapshotRow) => {
    if (isSaving) return;
    setEditingId(row.id);
    setDraft({ ...row });
    setIsNewDraft(false);
  };

  const handleCancel = () => {
    if (isSaving) return;
    setEditingId(null);
    setDraft(null);
    setIsNewDraft(false);
  };

  const refreshTables = async () => {
    await loadLatest();
    if (showAll) {
      await loadAllPage(allPage);
    }
  };

  const handleSave = async () => {
    if (!draft || !asset?.id || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        amount: draft.amount,
        as_of: dayjs(draft.date).toISOString(),
      };
      if (isNewDraft) {
        await createBalance(asset.id, payload);
      } else {
        await updateBalance(asset.id, draft.id, payload);
      }
      await refreshTables();
      setHasChanges(true);
      setEditingId(null);
      setDraft(null);
      setIsNewDraft(false);
    } catch (error) {
      enqueueSnackbar((error as Error).message || "保存失败，请稍后重试", { severity: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestDelete = (row: SnapshotRow) => {
    if (isSaving) return;
    setDeleteState({ open: true, row, loading: false });
  };

  const handleCancelDelete = () => {
    if (deleteState.loading) return;
    setDeleteState({ open: false, row: undefined, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteState.row || !asset?.id || deleteState.loading) return;
    setDeleteState((prev) => ({ ...prev, loading: true }));
    try {
      await deleteBalance(asset.id, deleteState.row.id);
      await refreshTables();
      if (editingId === deleteState.row.id) {
        setEditingId(null);
        setDraft(null);
        setIsNewDraft(false);
      }
      setHasChanges(true);
      setDeleteState({ open: false, row: undefined, loading: false });
    } catch (error) {
      enqueueSnackbar((error as Error).message || "删除失败，请稍后重试", { severity: "error" });
      setDeleteState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleToggleAll = async () => {
    if (!showAll) {
      setShowAll(true);
      setAllPage(1);
      await loadAllPage(1);
      return;
    }
    setShowAll(false);
    setEditingId(null);
    setDraft(null);
    setIsNewDraft(false);
  };

  const handleAllPageChange = async (page: number) => {
    setAllPage(page);
    await loadAllPage(page);
  };

  const currentRows = showAll ? allRows : rows;

  const tableRows = useMemo(() => {
    if (!showAll) {
      if (draft && isNewDraft) {
        return normalizeSnapshots([draft, ...currentRows], 5);
      }
      return normalizeSnapshots(currentRows, 5);
    }
    if (draft && isNewDraft) {
      return [draft, ...currentRows];
    }
    return currentRows;
  }, [currentRows, draft, isNewDraft, showAll]);

  const chartData = useMemo(() => {
    return normalizeSnapshots(rows, 6)
      .map((row) => ({
        month: dayjs(row.date).format("MM-DD"),
        amount: Number(row.amount || 0),
      }))
      .reverse();
  }, [rows]);

  return (
    <Drawer anchor="right" open={open} onClose={() => onClose(hasChanges)}>
      <Box sx={{ width: { xs: "100vw", sm: 560 }, p: 3, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={0.5}>
            <Typography variant="h6">余额快照</Typography>
            <Typography variant="body2" color="text.secondary">
              {asset ? `${asset.institution} · ${asset.account} · ${asset.currency}` : "未选择资产"}
            </Typography>
          </Stack>
          <IconButton onClick={() => onClose(hasChanges)} disabled={isSaving || deleteState.loading}>
            <Close />
          </IconButton>
        </Stack>

        <Divider />

        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">
              {showAll ? "历史余额快照" : "最新 5 条余额快照"}
            </Typography>
            <Button variant="contained" onClick={handleAdd} disabled={isSaving || deleteState.loading}>
              新增快照
            </Button>
          </Stack>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>日期</TableCell>
                  <TableCell>余额</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => {
                  const isEditing = editingId === row.id;
                  const displayRow = isEditing && draft ? draft : row;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            type="date"
                            size="small"
                            value={displayRow.date}
                            onChange={(e) =>
                              setDraft((prev) => (prev ? { ...prev, date: e.target.value } : prev))
                            }
                            disabled={isSaving}
                          />
                        ) : (
                          displayRow.date
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={displayRow.amount}
                            onChange={(e) =>
                              setDraft((prev) => (prev ? { ...prev, amount: e.target.value } : prev))
                            }
                            placeholder="输入余额"
                            disabled={isSaving}
                          />
                        ) : (
                          displayRow.amount
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="contained" onClick={handleSave} disabled={isSaving}>
                              {isSaving ? "保存中..." : "保存"}
                            </Button>
                            <Button size="small" onClick={handleCancel} disabled={isSaving}>
                              取消
                            </Button>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => handleEdit(row)} disabled={isSaving || deleteState.loading}>
                              编辑
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleRequestDelete(row)}
                              disabled={isSaving || deleteState.loading}
                            >
                              删除
                            </Button>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {tableRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary">
                        {isLoadingAll ? "加载中..." : "暂无余额快照"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button variant="text" onClick={handleToggleAll} disabled={isSaving || deleteState.loading}>
              {showAll ? "收起" : "查看全部"}
            </Button>
            {showAll && (
              <Pagination
                color="primary"
                page={allPage}
                count={allPageCount}
                onChange={(_event, value) => handleAllPageChange(value)}
                size="small"
              />
            )}
          </Stack>
        </Stack>

        {!showAll && (
          <>
            <Divider sx={{ my: 1 }} />

            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant="subtitle1">近半年余额变化</Typography>
              <Box sx={{ flex: 1, minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, "余额"]} />
                    <Line type="monotone" dataKey="amount" stroke="#1976d2" activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </>
        )}
      </Box>
      <ConfirmDialog
        open={deleteState.open}
        title="确认删除"
        description={deleteState.row ? `确认删除 ${deleteState.row.date} 的余额快照吗？` : undefined}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmText="删除"
        loading={deleteState.loading}
      />
    </Drawer>
  );
};

export default AssetBalanceSnapshotDrawer;
