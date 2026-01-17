import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { Table, Filter } from '../Tables';
import type { FilterItem } from '../Tables/TableFilter';
import StatusBadge from '../StatusBadge';
import type { ReactNode } from 'react';

export type AssetRow = {
  id: string;
  institution: string; // 机构
  account: string; // 账户/资产
  currency: string; // 币种
  balance: string; // 余额，已格式化
  updatedAt: string; // 更新时间
  status: string; // 状态
};

export type AssetDetailsCardProps = {
  title: string;
  filters: FilterItem[];
  selectedFilters: { [key: string]: string | number };
  onFilterChange: (key: string, value: string | number) => void;
  rows: AssetRow[];
  onView?: (row: AssetRow) => void;
  onEdit?: (row: AssetRow) => void;
  onDelete?: (row: AssetRow) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  chips?: ReactNode[];
};

const AssetDetailsCard = (_props: AssetDetailsCardProps) => {
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
              label: '资产',
              key: 'account',
              render: (row) => <Typography>{row.account}</Typography>,
            },
            {
              label: '机构',
              key: 'institution',
              render: (row) => <Typography>{row.institution}</Typography>,
            },
            {
              label: '币种',
              key: 'currency',
              render: (row) => <Typography>{row.currency}</Typography>,
            },
            {
              label: '余额',
              key: 'balance',
              render: (row) => <Typography>{row.balance}</Typography>,
            },
            {
              label: '状态',
              key: 'status',
              render: (row) => <StatusBadge status={row.status} />,
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

export default AssetDetailsCard;
