import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
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
import { ExchangeRateTrendCard, MonthlySavingsTrendCard, MonthlySpendingCard, TotalBalanceCard, UpcomingPaymentsCard } from '../components/Cards/index';

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

const DashboardPage = () => {
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
            <MonthlySavingsTrendCard />
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
            <ExchangeRateTrendCard />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};

export default DashboardPage;
