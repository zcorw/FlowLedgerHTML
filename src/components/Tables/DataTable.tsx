import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Pagination,
  Stack,
  TableContainer,
  Box,
} from '@mui/material';
import type { ReactNode } from 'react';

type Column<T> = {
  label: string;
  key: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  title: string;
  chips?: ReactNode[];
  rows: T[];
  columns: Column<T>[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

function DataTable<T>({ title, chips = [], rows, columns, page, pageCount, onPageChange }: DataTableProps<T>) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>
          {chips.length > 0 && (
            <Stack direction="row" spacing={1}>
              {chips}
            </Stack>
          )}
        </Stack>
        <Box>
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
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>{col.render(row)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <Pagination
            color="primary"
            page={page}
            count={pageCount}
            onChange={(_event, value) => onPageChange(value)}
            shape="rounded"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default DataTable;
