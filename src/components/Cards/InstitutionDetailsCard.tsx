import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { Table, Filter } from '../Tables';
import type { FilterItem } from '../Tables/TableFilter';
import type { ReactNode } from 'react';

export type InstitutionRow = {
  id: string;
  name: string;
  type: string;
  assetNum: number;
  status: string;
};

export type InstitutionDetailsCardProps = {
  title: string;
  filters: FilterItem[];
  selectedFilters: { [key: string]: string | number };
  onFilterChange: (key: string, value: string | number) => void;
  rows: InstitutionRow[];
  onView?: (row: InstitutionRow) => void;
  onEdit?: (row: InstitutionRow) => void;
  onDelete?: (row: InstitutionRow) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  chips?: ReactNode[];
};

const renderType = (type: string) => {
  if (type === 'bank') return '银行';
  if (type === 'broker') return '券商';
  if (type === 'other') return '其他';
  return type;
};

const renderStatus = (status: string) => {
  const key = status.toLowerCase();
  const meta: Record<string, { color: string; label: string }> = {
    active: { color: '#2e7d32', label: '在用' },
    inactive: { color: '#ed6c02', label: '停用' },
    closed: { color: '#6e6e6e', label: '关闭' },
  };
  const info = meta[key] ?? { color: '#6e6e6e', label: status || '-' };
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: info.color }} />
      <Typography variant="body2">{info.label}</Typography>
    </Stack>
  );
};

const InstitutionDetailsCard = (_props: InstitutionDetailsCardProps) => {
  return (
    <>
      <Grid item xs={12}>
        <Filter
          filters={_props.filters}
          values={_props.selectedFilters}
          onChange={_props.onFilterChange}
        />
      </Grid>
      <Grid item xs={12}>
        <Table
          title={_props.title}
          chips={_props.chips}
          rows={_props.rows}
          columns={[
            {
              label: '机构',
              key: 'name',
              render: (row) => <Typography>{row.name}</Typography>,
            },
            {
              label: '类型',
              key: 'type',
              render: (row) => <Typography>{renderType(row.type)}</Typography>,
            },
            {
              label: '关联资产数',
              key: 'assetNum',
              render: (row) => <Typography>{row.assetNum}</Typography>,
            },
            {
              label: '状态',
              key: 'status',
              render: (row) => renderStatus(row.status),
            },
            {
              label: '操作',
              key: 'actions',
              render: (row) => (
                <Stack direction="row" spacing={1}>
                  {_props.onView && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => _props.onView && _props.onView(row)}
                    >
                      查看
                    </Button>
                  )}
                  {_props.onEdit && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => _props.onEdit && _props.onEdit(row)}
                    >
                      编辑
                    </Button>
                  )}
                  {_props.onDelete && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => _props.onDelete && _props.onDelete(row)}
                    >
                      删除
                    </Button>
                  )}
                </Stack>
              ),
            },
          ]}
          page={_props.page}
          pageCount={_props.pageCount}
          onPageChange={_props.onPageChange}
        />
      </Grid>
    </>
  );
};

export default InstitutionDetailsCard;
