import { Card, CardContent, Stack, Typography, Box } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useMemo } from 'react';
import useCurrencyStore, { selectCurrencyMap } from '@/store/currency';
import type { CurrencyAssetItem } from '@/api/custom';

type AssetCurrencyBarCardProps = {
  data: CurrencyAssetItem[];
};

const AssetCurrencyBarCard = (props: AssetCurrencyBarCardProps) => {
  const { data } = props;
  const currencyMap = useCurrencyStore(selectCurrencyMap);

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: currencyMap[item.currency].name,
        current: item.amount,
        previous: item.amount - item.change,
        change: item.change,
      })),
    [data],
  );

  const formatCurrencyAmount = (currency: string, value?: number | ValueType) => {
    if (value === undefined || value === null) return '--';
    if (Array.isArray(value)) return formatCurrencyAmount(currency, value[0]);
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return String(value);
    try {
      return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(num);
    } catch {
      const symbol = currencyMap[currency]?.symbol ?? '';
      return `${symbol ? `${symbol} ` : ''}${num.toLocaleString()}`;
    }
  };

  return (
    <Card sx={{ height: 320 }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" gutterBottom>
            币种资产对比
          </Typography>
        </Stack>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => Number(value).toLocaleString()} />
            <Tooltip
              formatter={(value, name, item) => {
                const payload = item?.payload as { name: string } | undefined;
                const currency = payload?.name ?? '';
                const label = name === 'current' ? '当前资产' : '上次资产';
                return [formatCurrencyAmount(currency, value as ValueType | undefined), label] as [string, string];
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as {
                  name: string;
                  current: number;
                  previous: number;
                  change: number;
                };
                return (
                  <Box sx={{ p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="body2">{`当前：${formatCurrencyAmount(item.name, item.current)}`}</Typography>
                    <Typography variant="body2">{`上次：${formatCurrencyAmount(item.name, item.previous)}`}</Typography>
                    <Typography variant="body2">{`变化：${formatCurrencyAmount(item.name, item.change)}`}</Typography>
                  </Box>
                );
              }}
            />
            <Bar dataKey="current" name="current" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="previous" name="previous" fill="#F59E0B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AssetCurrencyBarCard;
