import {
  Card,
  CardContent,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useMemo, useState, type ChangeEvent } from 'react';
import { importRates } from "@/api/currency";
import { enqueueSnackbar } from "@/store/snackbar";

type RangeKey = 'week' | 'month' | 'quarter' | 'year';
type RatePoint = { label: string; rate: number };

const exchangeRateSeries: Record<string, Record<RangeKey, RatePoint[]>> = {
  USD: {
    week: [
      { label: '周一', rate: 7.24 },
      { label: '周二', rate: 7.22 },
      { label: '周三', rate: 7.21 },
      { label: '周四', rate: 7.19 },
      { label: '周五', rate: 7.18 },
      { label: '周六', rate: 7.2 },
      { label: '周日', rate: 7.19 },
    ],
    month: [
      { label: '第1周', rate: 7.26 },
      { label: '第2周', rate: 7.23 },
      { label: '第3周', rate: 7.21 },
      { label: '第4周', rate: 7.18 },
    ],
    quarter: [
      { label: '1月', rate: 7.27 },
      { label: '2月', rate: 7.25 },
      { label: '3月', rate: 7.21 },
    ],
    year: [
      { label: '1月', rate: 7.31 },
      { label: '3月', rate: 7.25 },
      { label: '5月', rate: 7.22 },
      { label: '7月', rate: 7.18 },
      { label: '9月', rate: 7.19 },
      { label: '11月', rate: 7.16 },
    ],
  },
  EUR: {
    week: [
      { label: '周一', rate: 7.92 },
      { label: '周二', rate: 7.95 },
      { label: '周三', rate: 7.97 },
      { label: '周四', rate: 7.94 },
      { label: '周五', rate: 7.9 },
      { label: '周六', rate: 7.91 },
      { label: '周日', rate: 7.93 },
    ],
    month: [
      { label: '第1周', rate: 7.98 },
      { label: '第2周', rate: 7.95 },
      { label: '第3周', rate: 7.93 },
      { label: '第4周', rate: 7.91 },
    ],
    quarter: [
      { label: '1月', rate: 7.99 },
      { label: '2月', rate: 7.97 },
      { label: '3月', rate: 7.92 },
    ],
    year: [
      { label: '1月', rate: 8.02 },
      { label: '3月', rate: 7.98 },
      { label: '5月', rate: 7.95 },
      { label: '7月', rate: 7.93 },
      { label: '9月', rate: 7.9 },
      { label: '11月', rate: 7.88 },
    ],
  },
  JPY: {
    week: [
      { label: '周一', rate: 0.048 },
      { label: '周二', rate: 0.0485 },
      { label: '周三', rate: 0.0491 },
      { label: '周四', rate: 0.0488 },
      { label: '周五', rate: 0.0482 },
      { label: '周六', rate: 0.0484 },
      { label: '周日', rate: 0.0486 },
    ],
    month: [
      { label: '第1周', rate: 0.0489 },
      { label: '第2周', rate: 0.0485 },
      { label: '第3周', rate: 0.0481 },
      { label: '第4周', rate: 0.0483 },
    ],
    quarter: [
      { label: '1月', rate: 0.0493 },
      { label: '2月', rate: 0.0487 },
      { label: '3月', rate: 0.0482 },
    ],
    year: [
      { label: '1月', rate: 0.0498 },
      { label: '3月', rate: 0.049 },
      { label: '5月', rate: 0.0486 },
      { label: '7月', rate: 0.0483 },
      { label: '9月', rate: 0.0481 },
      { label: '11月', rate: 0.0479 },
    ],
  },
};

const formatRate = (value?: ValueType): string => {
  if (Array.isArray(value)) return formatRate(value[0]);
  return Number(value ?? 0).toFixed(3);
};

const ExchangeRateTrendCard = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<keyof typeof exchangeRateSeries>('USD');
  const [selectedRange, setSelectedRange] = useState<RangeKey>('month');
  const [isImporting, setIsImporting] = useState(false);

  const rateSeries = useMemo(
    () => exchangeRateSeries[selectedCurrency][selectedRange] ?? [],
    [selectedCurrency, selectedRange],
  );

  const handleImportRates = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const result = await importRates(file);
      const hasFailures = result.failed > 0;
      enqueueSnackbar(`导入完成：新增 ${result.created}，更新 ${result.updated}，失败 ${result.failed}`, {
        severity: hasFailures ? 'warning' : 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      enqueueSnackbar(`导入失败：${message}`, { severity: 'error' });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <Card sx={{ height: 380 }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">汇率走势</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button size="small" variant="outlined" component="label" disabled={isImporting}>
              导入历史汇率
              <input type="file" hidden accept=".xlsx" onChange={handleImportRates} />
            </Button>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={selectedCurrency}
                onChange={(event: SelectChangeEvent<string>) =>
                  setSelectedCurrency(event.target.value as keyof typeof exchangeRateSeries)
                }
              >
                <MenuItem value="USD">USD/CNY</MenuItem>
                <MenuItem value="EUR">EUR/CNY</MenuItem>
                <MenuItem value="JPY">JPY/CNY</MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={selectedRange}
              onChange={(_event, value: RangeKey | null) => value && setSelectedRange(value)}
            >
              <ToggleButton value="week">1周</ToggleButton>
              <ToggleButton value="month">1月</ToggleButton>
              <ToggleButton value="quarter">3月</ToggleButton>
              <ToggleButton value="year">1年</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        <ResponsiveContainer width="100%" height="82%">
          <LineChart data={rateSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis domain={['dataMin - 0.02', 'dataMax + 0.02']} />
            <Tooltip formatter={(value) => [`${formatRate(value)}`, '汇率']} />
            <Legend />
            <Line
              type="monotone"
              dataKey="rate"
              name={`${selectedCurrency}/CNY`}
              stroke="#7e57c2"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateTrendCard;
