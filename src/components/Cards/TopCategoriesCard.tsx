import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import ExpenseRatioBar, { type Props as ExpenseRatioBarProps } from '../ExpenseRatioBar';

type TopCategoriesCardProps = {
  title: string;
  barData: ExpenseRatioBarProps['data'];
};

const TopCategoriesCard = ({ title, barData }: TopCategoriesCardProps) => {
  const topCount = barData.length;
  const categories = barData.map((item) => item.label);
  const coveragePercent = barData.reduce((total, item) => {
    return categories.includes(item.label) ? total + item.percent : total;
  }, 0);

  const coverageText = `前 ${topCount} 占比 ${coveragePercent.toFixed(0)}%`;
  const categoriesText = categories.join(' / ');

  return (
    <Card sx={{ height: 180 }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{title}</Typography>
          <Chip label={coverageText} size="small" variant="outlined" />
        </Stack>

        <Typography variant="subtitle1" fontWeight={700} mb={2}>
          {categoriesText}
        </Typography>

        <ExpenseRatioBar data={barData} />
      </CardContent>
    </Card>
  );
};

export default TopCategoriesCard;
