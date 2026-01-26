import { Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material"
import useAuthStore, { formatAmount, selectPreferences } from "@/store/auth";

export type AssetCurrencyCardProps = {
  title: string;
  amount: number;
  change: number;
  rate: number;
}
const DepositsTotalCard = (_props: AssetCurrencyCardProps) => {
  const preferences = useAuthStore(selectPreferences);
  // Format change percent string，如果本月比上月上涨显示“较上月 +￥5,000.00，上涨4.3%”，否则显示“较上月 较上月 -￥5,000.00，下跌4.3%”
  const changePercentString = _props.rate > 0 ? 
    `较上月 +${formatAmount(_props.change, preferences)}，上涨${_props.rate.toFixed(1)}%` : 
    `较上月 ${formatAmount(_props.change, preferences)}，下跌${Math.abs(_props.rate).toFixed(1)}%`;
  return (
    <Card sx={{ height: '180px' }}>
      <CardContent>
        <Grid container justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom>
            {_props.title}
          </Typography>
        </Grid>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" fontSize={30} fontWeight={700}>{formatAmount(_props.amount, preferences)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mt="18px">
          {changePercentString}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default DepositsTotalCard