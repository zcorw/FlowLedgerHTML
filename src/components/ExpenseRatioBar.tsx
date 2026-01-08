import { Box, Typography } from '@mui/material';

export type Props = {
  data: {
    label: string;
    percent: number;
    color: string;
  }[];
};

export default function ExpenseRatioBar({ data }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        height: 32,
        width: '100%',
        borderRadius: 5,
        overflow: 'hidden',
        bgcolor: 'rgba(255,255,255,0.08)',
      }}
    >
      {data.map((item) => {
        const showLabel = item.percent >= 10;

        return (
          <Box
            key={item.label}
            sx={{
              width: `${item.percent}%`,
              bgcolor: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {showLabel && (
              <Typography
                variant="caption"
                sx={{
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {item.label}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
