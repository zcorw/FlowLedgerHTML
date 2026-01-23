import { Card, CardContent, Stack, Typography, Box } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useEffect, useMemo, useState } from 'react';
import {
  listInstitutionAssetChanges,
  type InstitutionAssetChange,
} from '@/api/custom';
import useCurrencyStore, { selectCurrencyMap } from '@/store/currency';

type ChartItem = {
  name: string;
  delta: number;
  current_total: string;
  previous_total: string;
};

const parseAmount = (value?: string) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const InstitutionAssetChangeCard = () => {
  const [data, setData] = useState<InstitutionAssetChange[]>([]);
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currencyMap = useCurrencyStore(selectCurrencyMap);

  const formatAmount = (value?: string | number | ValueType) => {
    if (value === undefined || value === null) return '--';
    if (Array.isArray(value)) return formatAmount(value[0]);
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return String(value);
    if (currency) {
      try {
        return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(num);
      } catch {
        const symbol = currencyMap[currency]?.symbol ?? '';
        return `${symbol ? `${symbol} ` : ''}${num.toLocaleString()}`;
      }
    }
    return num.toLocaleString();
  };

  const chartData = useMemo<ChartItem[]>(
    () =>
      data.map((item) => ({
        name: item.institution_name,
        delta: parseAmount(item.delta),
        current_total: item.current_total,
        previous_total: item.previous_total,
      })),
    [data],
  );

  useEffect(() => {
    let active = true;
    const fetchChanges = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listInstitutionAssetChanges({ limit: 10 });
        if (!active) return;
        setData(result.data ?? []);
        setCurrency(result.currency);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : '未知错误';
        setError(message);
        setData([]);
        setCurrency('');
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchChanges();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card sx={{ height: 320 }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" gutterBottom>
            {`机构资产变动排行${currency ? ` (${currency})` : ''}`}
          </Typography>
          {loading && (
            <Typography variant="body2" color="text.secondary">
              加载中...
            </Typography>
          )}
          {!loading && error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatAmount(value)} />
            <Tooltip
              formatter={(value) => [formatAmount(value as ValueType | undefined), '变动'] as [string, string]}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as ChartItem;
                return (
                  <Box sx={{ p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="body2">{`当前：${formatAmount(item.current_total)}`}</Typography>
                    <Typography variant="body2">{`上次：${formatAmount(item.previous_total)}`}</Typography>
                    <Typography variant="body2">{`变动：${formatAmount(item.delta)}`}</Typography>
                  </Box>
                );
              }}
            />
            <Bar dataKey="delta" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.delta >= 0 ? '#2e7d32' : '#d32f2f'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default InstitutionAssetChangeCard;
