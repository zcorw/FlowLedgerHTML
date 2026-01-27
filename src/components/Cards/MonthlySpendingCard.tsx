import { Card, CardContent, Stack, Typography } from '@mui/material';
import useAuthStore, { formatAmount, selectPreferences } from '@/store/auth'

type MonthlySpendingCardProps = {
  amount: number;
  lastMonthAmount: number;
};

const MonthlySpendingCard = (_props: MonthlySpendingCardProps) => {
  const preferences = useAuthStore(selectPreferences);
  return (
    <Card sx={{ height: '180px' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          本月支出
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" fontSize={30} fontWeight={700}>{formatAmount(_props.amount, preferences)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mt="18px">
          上月支出：-{formatAmount(_props.lastMonthAmount, preferences)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MonthlySpendingCard;
