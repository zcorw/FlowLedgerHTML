import { Box, Chip, Grid, Stack, TextField, Typography, Card, CardContent, ButtonGroup, Button } from '@mui/material';
import { MonthlySpendingCard, DailySpendingCard, TopCategoriesCard, CategoryRatioCard, ExpenseDetailsCard } from '@/components/Cards/index';
import type { ExpenseRow, ExpenseDetailsCardProps } from '@/components/Cards/ExpenseDetailsCard';
import { useState, useEffect, useMemo } from 'react';

const topCategoryData = [
  { label: '餐饮', percent: 38, color: '#26c6da' },
  { label: '居住', percent: 20, color: '#5c6bc0' },
  { label: '出行', percent: 10, color: '#90a4ae' },
];

const topCurrencyData = [
  { label: '美元', percent: 38, color: '#ffb300' },
  { label: '日元', percent: 20, color: '#8d6e63' },
  { label: '港币', percent: 20, color: '#78909c' },
];

const expenseRows: ExpenseRow[] = [
  { id: '1', date: '09-12', category: '餐饮', amount: '- ¥ 86.00', currency: 'CNY', note: '午餐' },
  { id: '2', date: '09-11', category: '出行', amount: '- ¥ 32.00', currency: 'CNY', note: '地铁' },
  { id: '3', date: '09-10', category: '订阅', amount: '- $ 29.00', currency: 'USD', note: '云服务' },
  { id: '4', date: '09-09', category: '居住', amount: '- ¥ 2600.00', currency: 'CNY', note: '房租' },
  { id: '5', date: '09-08', category: '餐饮', amount: '- ¥ 58.00', currency: 'CNY', note: '咖啡' },
  { id: '6', date: '09-07', category: '餐饮', amount: '- ¥ 120.00', currency: 'CNY', note: '聚餐' },
];

const FilterItems: ExpenseDetailsCardProps['filters'] = [
  { 
    key: 'time',
    label: '时间',
    type: 'menu',
    options: [
      { label: '本周', value: 'week' },
      { label: '30天', value: '30d' },
      { label: '本月', value: 'month' },
      { label: '全部', value: 'all' },
    ],
  },
  { 
    key: 'currency',
    label: '币种',
    type: 'menu',
    options: [
      { label: '全部', value: 'all' },
      { label: 'CNY', value: 'CNY' },
      { label: 'USD', value: 'USD' },
    ],
  },
  { 
    key: 'keyword',
    label: '关键词',
    type: 'input',
  },
];

// 时间范围选项
const timeOptions = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '30天', value: '30d' },
]

const ExpensesPage = () => {
  const [dailyPeriod, setDailyPeriod] = useState('week');
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState({
    time: 'week',
    currency: 'all',
    keyword: '',
  });
  const onTableFilterChange = (key: string, value: string | number) => {
    setTableFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page on filter change
  }
  useEffect(() => {
    console.log('Daily period changed to:', dailyPeriod);
  }, [dailyPeriod]);

  const categoryOptions = ['全部', '餐饮', '居住', '出行', '订阅'];

  const latestDate = useMemo(() => {
    const parsedDates = expenseRows.map((row) => new Date(`2024-${row.date}`));
    return new Date(Math.max(...parsedDates.map((d) => d.getTime())));
  }, []);

  const rowsPerPage = 3;

  const pageCount = Math.max(1, Math.ceil(10/ rowsPerPage));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return [].slice(start, start + rowsPerPage);
  }, [page]);
  return (
    <Box pt={4}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" component="h1" style={{ fontWeight: 700 }}>
            消费管理
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <ButtonGroup variant="outlined" aria-label="outlined button group">
            {timeOptions.map((option) => (
              <Button
                key={option.value}
                variant={dailyPeriod === option.value ? 'contained' : 'outlined'}
                onClick={() => setDailyPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </Stack>
        

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <MonthlySpendingCard amount={6820} lastMonthAmount={7200} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TopCategoriesCard
              title="主要分类"
              barData={topCategoryData}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TopCategoriesCard
              title="主要币种"
              barData={topCurrencyData}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <CategoryRatioCard
              title="分类占比"
              items={[
                { label: '餐饮', percent: 38 },
                { label: '居住', percent: 20 },
                { label: '出行', percent: 10 },
                { label: '购物', percent: 8 },
                { label: '娱乐', percent: 6 },
              ]}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CategoryRatioCard
              title="币种占比"
              items={[
                { label: '美元', percent: 38 },
                { label: '日元', percent: 20 },
                { label: '港币', percent: 20 },
                { label: '人民币', percent: 10 },
              ]}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          {/* 消费详情列表 */}
          <ExpenseDetailsCard
            rows={pagedRows}
            page={page}
            pageCount={pageCount}
            onPageChange={(page: number) => setPage(page)}
            title="消费详情"
            filters={FilterItems}
            selectedFilters={tableFilter}
            onFilterChange={onTableFilterChange}
            chips={
              categoryOptions.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  clickable
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category)}
                />
              ))
            }
          />
        </Grid>
      </Stack>
    </Box>
  );
};

export default ExpensesPage;
