import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { Table, Filter } from '../Tables';
import type { FilterItem } from '../Tables/TableFilter';
import StatusBadge from '../StatusBadge';
import type { ReactNode } from 'react';
import {InstitutionTypes} from "@/validation/deposit";

export type InstitutionRow = {
  id: number;
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
  onBulkUpdate?: (row: InstitutionRow) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  chips?: ReactNode[];
};

const renderType = (type: string) => {
  const item = InstitutionTypes.find((it) => it.value === type);
  return item ? item.label : type;
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
                  {_props.onBulkUpdate && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => _props.onBulkUpdate && _props.onBulkUpdate(row)}
                    >
                      批量余额
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
