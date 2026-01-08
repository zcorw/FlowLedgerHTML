import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

const QuickAddExpenseForm = () => {
  return (
    <Card id="quick-add">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">快速记一笔</Typography>
          <Button variant="outlined" color="inherit" size="small">
            示例数据
          </Button>
        </Stack>
        <Stack spacing={2}>
          <TextField label="金额" placeholder="-86.00" fullWidth />
          <TextField label="币种" placeholder="CNY / USD / EUR" fullWidth />
          <TextField label="分类" placeholder="餐饮 / 交通 / 购物" fullWidth />
          <TextField label="备注" placeholder="如：午餐 / 出差打车" fullWidth />
          <TextField type="date" label="日期" InputLabelProps={{ shrink: true }} fullWidth />
          <Button variant="contained" color="primary" size="large">
            保存
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default QuickAddExpenseForm;
