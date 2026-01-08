import { Card, CardContent, Chip, List, ListItem, Stack, Typography } from '@mui/material';
import useAuthStore, { formatAmount, selectPreferences } from '@/store/auth';

export type PaymentTask = {
  title: string;
  dueDate: string;
  amount: number;
  tag?: string;
};

type UpcomingPaymentsCardProps = {
  tasks: PaymentTask[];
};

const UpcomingPaymentsCard = ({ tasks }: UpcomingPaymentsCardProps) => {
  const preferences = useAuthStore(selectPreferences);
  const hasTasks = tasks.length > 0;

  return (
    <Card sx={{ height: '180px' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">即将支付任务</Typography>
          <Chip label={`共 ${tasks.length} 条`} size="small" variant="outlined" />
        </Stack>

        {hasTasks ? (
          <List disablePadding>
            {tasks.slice(0, 2).map((task) => (
              <ListItem
                key={`${task.title}-${task.dueDate}`}
                sx={{
                  px: 0,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  height: '55px',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Stack width="100%" spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700}>{task.title}</Typography>
                    <Chip label={`到期 ${task.dueDate}`} size="small" variant="outlined" />
                    <Typography color="error" fontWeight={700}>
                      -{formatAmount(task.amount, preferences)}
                    </Typography>
                  </Stack>
                </Stack>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            暂无待处理任务，保持良好习惯！
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingPaymentsCard;
