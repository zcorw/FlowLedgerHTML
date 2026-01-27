import { Card, CardContent, Stack, Typography } from '@mui/material';
import useAuthStore, { formatAmount, selectPreferences } from '@/store/auth'
import PeriodSelector from '../PeriodSelector'

type DailySpendingCardProps = {
  amount: number;
  selectPeriod: string;
  changeRate: number;
  onPeriodChange: (period: string) => void;
};

const periods = [
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '本月', value: 'month' },
];

function formatChangeRate(rate: number): string {
  if (rate > 0) {
    return `环比上升 ${(rate * 100).toFixed(1)}%`;
  } else {
    return `环比下降 ${(rate * 100).toFixed(1)}%`;
  }
}

const DailySpendingCard = (_props: DailySpendingCardProps) => {
  const preferences = useAuthStore(selectPreferences);
  return (
    <Card sx={{ height: '180px' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" gutterBottom>
            平均支出
          </Typography>
          <PeriodSelector
            periods={periods}
            value={_props.selectPeriod}
            onChange={_props.onPeriodChange}
          />
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" fontSize={30} fontWeight={700}>{formatAmount(_props.amount, preferences)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mt="18px">
          {formatChangeRate(_props.changeRate)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DailySpendingCard;