import {
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useMemo, useState } from 'react';
import { TotalBalanceCard, MonthlySpendingCard, UpcomingPaymentsCard } from '../components/Cards/index';

type PaymentRow = {
  title: string;
  dueDate: string;
  amount: number;
};

const upcomingPayments: PaymentRow[] = [
  { title: '房租', dueDate: '09-15', amount: 3000 },
  { title: '水电费', dueDate: '09-18', amount: 450 },
  { title: '信用卡还款', dueDate: '09-20', amount: 1200 },
];

const savingsTrend = [
  { month: '1月', amount: 12000 },
  { month: '2月', amount: 12850 },
  { month: '3月', amount: 13200 },
  { month: '4月', amount: 14050 },
  { month: '5月', amount: 14500 },
  { month: '6月', amount: 15280 },
];

const spendingTrend = [
  { month: '1月', amount: 6200 },
  { month: '2月', amount: 6800 },
  { month: '3月', amount: 6400 },
  { month: '4月', amount: 7100 },
  { month: '5月', amount: 6950 },
  { month: '6月', amount: 6820 },
];

const spendingCategories = [
  { category: '房租', amount: 3200 },
  { category: '餐饮', amount: 1500 },
  { category: '生活服务', amount: 860 },
  { category: '出行', amount: 520 },
  { category: '居家', amount: 420 },
];

const formatCurrency = (value?: ValueType): string => {
  if (Array.isArray(value)) {
    return formatCurrency(value[0]);
  }
  return `¥ ${Number(value ?? 0).toLocaleString()}`;
};

type RangeKey = 'week' | 'month' | 'quarter' | 'year';
type RatePoint = { label: string; rate: number };

const exchangeRateSeries: Record<string, Record<RangeKey, RatePoint[]>> = {
  USD: {
    week: [
      { label: '周一', rate: 7.24 },
      { label: '周二', rate: 7.22 },
      { label: '周三', rate: 7.21 },
      { label: '周四', rate: 7.19 },
      { label: '周五', rate: 7.18 },
      { label: '周六', rate: 7.2 },
      { label: '周日', rate: 7.19 },
    ],
    month: [
      { label: '第1周', rate: 7.26 },
      { label: '第2周', rate: 7.23 },
      { label: '第3周', rate: 7.21 },
      { label: '第4周', rate: 7.18 },
    ],
    quarter: [
      { label: '1月', rate: 7.27 },
      { label: '2月', rate: 7.25 },
      { label: '3月', rate: 7.21 },
    ],
    year: [
      { label: '1月', rate: 7.31 },
      { label: '3月', rate: 7.25 },
      { label: '5月', rate: 7.22 },
      { label: '7月', rate: 7.18 },
      { label: '9月', rate: 7.19 },
      { label: '11月', rate: 7.16 },
    ],
  },
  EUR: {
    week: [
      { label: '周一', rate: 7.92 },
      { label: '周二', rate: 7.95 },
      { label: '周三', rate: 7.97 },
      { label: '周四', rate: 7.94 },
      { label: '周五', rate: 7.9 },
      { label: '周六', rate: 7.91 },
      { label: '周日', rate: 7.93 },
    ],
    month: [
      { label: '第1周', rate: 7.98 },
      { label: '第2周', rate: 7.95 },
      { label: '第3周', rate: 7.93 },
      { label: '第4周', rate: 7.91 },
    ],
    quarter: [
      { label: '1月', rate: 7.99 },
      { label: '2月', rate: 7.97 },
      { label: '3月', rate: 7.92 },
    ],
    year: [
      { label: '1月', rate: 8.02 },
      { label: '3月', rate: 7.98 },
      { label: '5月', rate: 7.95 },
      { label: '7月', rate: 7.93 },
      { label: '9月', rate: 7.9 },
      { label: '11月', rate: 7.88 },
    ],
  },
  JPY: {
    week: [
      { label: '周一', rate: 0.048 },
      { label: '周二', rate: 0.0485 },
      { label: '周三', rate: 0.0491 },
      { label: '周四', rate: 0.0488 },
      { label: '周五', rate: 0.0482 },
      { label: '周六', rate: 0.0484 },
      { label: '周日', rate: 0.0486 },
    ],
    month: [
      { label: '第1周', rate: 0.0489 },
      { label: '第2周', rate: 0.0485 },
      { label: '第3周', rate: 0.0481 },
      { label: '第4周', rate: 0.0483 },
    ],
    quarter: [
      { label: '1月', rate: 0.0493 },
      { label: '2月', rate: 0.0487 },
      { label: '3月', rate: 0.0482 },
    ],
    year: [
      { label: '1月', rate: 0.0498 },
      { label: '3月', rate: 0.049 },
      { label: '5月', rate: 0.0486 },
      { label: '7月', rate: 0.0483 },
      { label: '9月', rate: 0.0481 },
      { label: '11月', rate: 0.0479 },
    ],
  },
};

const formatRate = (value?: ValueType): string => {
  if (Array.isArray(value)) return formatRate(value[0]);
  return Number(value ?? 0).toFixed(3);
};

const DashboardPage = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<keyof typeof exchangeRateSeries>('USD');
  const [selectedRange, setSelectedRange] = useState<RangeKey>('month');

  const rateSeries = useMemo(
    () => exchangeRateSeries[selectedCurrency][selectedRange] ?? [],
    [selectedCurrency, selectedRange],
  );

  return (
    <Box pt={4}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" component="h1" style={{ fontWeight: 700 }}>
            支出与存款，一目了然
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TotalBalanceCard amount={1000} scale={1} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MonthlySpendingCard amount={6820} lastMonthAmount={7200} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <UpcomingPaymentsCard tasks={upcomingPayments} />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 320 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  每月存款变化
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={savingsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), '存款']} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#2e7d32"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: 320 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  每月支出变化
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={spendingTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), '支出']} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#d32f2f"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ height: 360 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  本月支出类别比例
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={spendingCategories} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), '金额']} />
                    <Legend />
                    <Bar dataKey="amount" name="金额" fill="#0288d1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ height: 380 }}>
              <CardContent sx={{ height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">汇率走势</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={selectedCurrency}
                        onChange={(event: SelectChangeEvent<string>) =>
                          setSelectedCurrency(event.target.value as keyof typeof exchangeRateSeries)
                        }
                      >
                        <MenuItem value="USD">USD/CNY</MenuItem>
                        <MenuItem value="EUR">EUR/CNY</MenuItem>
                        <MenuItem value="JPY">JPY/CNY</MenuItem>
                      </Select>
                    </FormControl>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={selectedRange}
                      onChange={(_event, value: RangeKey | null) => value && setSelectedRange(value)}
                    >
                      <ToggleButton value="week">1周</ToggleButton>
                      <ToggleButton value="month">1月</ToggleButton>
                      <ToggleButton value="quarter">3月</ToggleButton>
                      <ToggleButton value="year">1年</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Stack>

                <ResponsiveContainer width="100%" height="82%">
                  <LineChart data={rateSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={['dataMin - 0.02', 'dataMax + 0.02']} />
                    <Tooltip formatter={(value) => [`${formatRate(value)}`, '汇率']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name={`${selectedCurrency}/CNY`}
                      stroke="#7e57c2"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};

export default DashboardPage;
