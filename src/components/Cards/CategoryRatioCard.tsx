import { Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type CategoryRatio = {
  label: string;
  percent: number; // 0 - 100
};

type CategoryRatioCardProps = {
  title: string;
  items: CategoryRatio[];
  tag?: ReactNode;
};

const CategoryRatioCard = ({ title, items, tag }: CategoryRatioCardProps) => {
  return (
    <Card sx={{ height: 290 }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>
          {tag && <Box>{tag}</Box>}
        </Stack>

        <Stack spacing={2.5}>
          {items.map((item) => (
            <Stack key={item.label} direction="row" alignItems="center" spacing={2}>
              <Typography minWidth={96} fontWeight={600}>
                {`${item.label} ${item.percent}%`}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={item.percent}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: 'rgba(255,255,255,0.08)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      bgcolor: '#26c6da',
                    },
                  }}
                />
              </Box>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CategoryRatioCard;
