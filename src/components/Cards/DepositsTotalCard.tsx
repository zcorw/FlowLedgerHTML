import { Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material"
import useAuthStore, { formatAmount, selectPreferences } from "@/store/auth";
import { monthlyAssetChange } from "@/api/custom";
import { useEffect, useState, useMemo } from "react";

const DepositsTotalCard = () => {
  const [amount, setAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [date, setDate] = useState('');
  const [changePercent, setChangePercent] = useState(0);
  const preferences = useAuthStore(selectPreferences);
  // Format change percent string，如果本月比上月上涨显示“较上月 +￥5,000.00，上涨4.3%”，否则显示“较上月 较上月 -￥5,000.00，下跌4.3%”
  const changePercentString = useMemo(() => changePercent > 0 ? 
    `较上月 +${formatAmount(changeAmount, preferences)}，上涨${changePercent.toFixed(1)}%` : 
    `较上月 ${formatAmount(changeAmount, preferences)}，下跌${Math.abs(changePercent).toFixed(1)}%`,
    [changeAmount, changePercent, preferences]);
  useEffect(() => {
    monthlyAssetChange().then(res => {
      setAmount(res.amount);
      setChangeAmount(res.change);
      setDate(res.date);
      setChangePercent(res.rate * 100);
    })
  }, []);
  return (
    <Card sx={{ height: '180px' }}>
      <CardContent>
        <Grid container justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom>
            总存款
          </Typography>
          <Chip label={date} variant="outlined" />
        </Grid>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" fontSize={30} fontWeight={700}>{formatAmount(amount, preferences)}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mt="18px">
          {changePercentString}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default DepositsTotalCard