import { Card, CardContent, Stack, Typography } from '@mui/material';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useEffect, useState } from 'react';
import { getMonthlyAsset, type MonthlyAssetPoint } from '@/api/deposits';
import useCurrencyStore, { selectCurrencyMap } from '@/store/currency';

const getMonthRange = () => {
  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    from_dt: fromDate.toISOString().slice(0, 10),
    to_dt: now.toISOString().slice(0, 10),
  };
};

const MonthlySavingsTrendCard = () => {
  const [data, setData] = useState<MonthlyAssetPoint[]>([]);
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencyMap = useCurrencyStore(selectCurrencyMap);

  const formatCurrency = (value?: ValueType): string => {
    if (Array.isArray(value)) {
      return formatCurrency(value[0]);
    }
    return `${currencyMap[currency].symbol} ${Number(value ?? 0).toLocaleString()}`;
  };

  useEffect(() => {
    let active = true;
    const fetchMonthlyAssets = async () => {
      setLoading(true);
      setError(null);
      try {
        const range = getMonthRange();
        const result = await getMonthlyAsset(range);
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
    void fetchMonthlyAssets();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card sx={{ height: 320 }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" gutterBottom>
            {`每月存款变化 (${currency})`}
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
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCurrency(value), '存款']} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#2e7d32"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlySavingsTrendCard;
