import { Card, CardContent, Stack, Typography, Chip } from '@mui/material';
import useAuthStore, { formatAmount, selectPreferences } from '@/store/auth'
type TotalBalanceCardProps = {
  amount: number;
  scale: number;
};

function formatScale(scale: number): string {
  if (scale > 0) {
    return `+${(scale * 100).toFixed(1)}%`;
  } else {
    return `${(scale * 100).toFixed(1)}%`;
  }
}

const TotalBalanceCard = (_props: TotalBalanceCardProps) => {
  const preferences = useAuthStore(selectPreferences);
  return (
    <Card sx={{ height: '180px' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          总资产
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" fontSize={30} fontWeight={700}>{formatAmount(_props.amount, preferences)}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} mt={1}>
          <Chip
            label={`${formatScale(_props.scale)}本月`}
            color="success"
            variant="outlined"
            sx={{
              bgcolor: 'rgba(0, 200, 83, 0.15)',
              color: 'success.main',
              borderRadius: 2,
              fontWeight: 600,
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TotalBalanceCard;
