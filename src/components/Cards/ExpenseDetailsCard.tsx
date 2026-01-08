import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Table, Filter } from '../Tables';
import type { FilterItem } from '../Tables/TableFilter';
import type { ReactNode } from 'react';

export type ExpenseRow = {
  id: string;
  date: string; // e.g. 09-12
  category: string;
  amount: string; // formatted with currency, e.g. "- ¥ 86.00"
  currency: string;
  note?: string;
};

export type ChipOption = {
  label: string;
  value: string;
};

export type ExpenseDetailsCardProps = {
  title: string;
  filters: FilterItem[];
  selectedFilters: { [key: string]: string | number };
  onFilterChange: (key: string, value: string | number) => void;
  rows: ExpenseRow[];
  onEdit?: (row: ExpenseRow) => void;
  onDelete?: (row: ExpenseRow) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  chips?: ReactNode[];
};

const ExpenseDetailsCard = (_props: ExpenseDetailsCardProps) => {
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
              label: '日期',
              key: 'date',
              render: (row) => <Typography>{row.date}</Typography>,
            },
            {
              label: '类别',
              key: 'category',
              render: (row) => <Typography>{row.category}</Typography>,
            },
            {
              label: '金额',
              key: 'amount',
              render: (row) => <Typography>{row.amount}</Typography>,
            },
            {
              label: '备注',
              key: 'note',
              render: (row) => <Typography>{row.note || '-'}</Typography>,
            },
            {
              label: '操作',
              key: 'actions',
              render: (row) => (
                <Stack direction="row" spacing={1}>
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

export default ExpenseDetailsCard;
