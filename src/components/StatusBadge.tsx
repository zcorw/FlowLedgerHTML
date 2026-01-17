import { Box, Stack, Typography } from '@mui/material';

type Props = {
  status: string;
};
export const meta: Record<string, { color: string; label: string }> = {
  active: { color: '#2e7d32', label: '在用' },
  inactive: { color: '#ed6c02', label: '停用' },
  closed: { color: '#6e6e6e', label: '关闭' },
};
const StatusBadge = ({ status }: Props) => {
  const key = status.toLowerCase();
  const info = meta[key] ?? { color: '#6e6e6e', label: status || '-' };
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: info.color }} />
      <Typography variant="body2">{info.label}</Typography>
    </Stack>
  );
};

export default StatusBadge;