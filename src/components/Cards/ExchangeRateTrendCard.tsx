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
import { useMemo, useState, useEffect, type ChangeEvent } from 'react';
import { importRates, triggerExchangeRateSync, listExchangeRates, type ListExchangeRatesParams, type ExchangeRateRangeResponse } from "@/api/currency";
import { enqueueSnackbar } from "@/store/snackbar";
import useCurrencyStore, { selectCurrencies } from "@/store/currency";
import useAuthStore, { selectPreferences } from "@/store/auth";
import dayjs from "dayjs";

type RangeKey = 'week' | 'month' | 'quarter' | 'year';
type RatePoint = { label: string; rate: number };
type RateOption = { base: string; quote: string };

const formatRate = (value?: ValueType): string => {
  if (Array.isArray(value)) return formatRate(value[0]);
  return Number(value ?? 0).toFixed(3);
};

const ExchangeRateTrendCard = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<RangeKey>('month');
  const [isImporting, setIsImporting] = useState(false);
  const [rateSeries, setRateSeries] = useState<RatePoint[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<RateOption[]>([]);

  const _currencies = useCurrencyStore(selectCurrencies);

  const _preferences = useAuthStore(selectPreferences);
  useEffect(() => {
    if (!_preferences || !_currencies.length) return;
    const options = _currencies
      .filter((c) => c.code !== _preferences.base_currency)
      .map<RateOption>((c) => ({
        base: c.code,
        quote: _preferences.base_currency as string,
      }));
    setCurrencyOptions(options);  
    console.log("options", options);
    setSelectedCurrency(options[0].base);  
  }, [_preferences, _currencies]);

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

  function fetchLatestRates() {
    triggerExchangeRateSync().catch((error) => enqueueSnackbar(error.message, { severity: 'error' }));
  }

  useEffect(() => {
    console.log("selectedCurrency", selectedCurrency, "selectedRange", selectedRange);
    if (!selectedCurrency || !selectedRange) return;
    const params: ListExchangeRatesParams = {
      base: selectedCurrency,
      quote: _preferences?.base_currency as string,
      from: dayjs().format("YYYY-MM-DD"),
      to: dayjs().format("YYYY-MM-DD"),
    };
    switch (selectedRange) {
      case "week":
        params.from = dayjs().subtract(1, 'week').format("YYYY-MM-DD");
        break;
      case "month":
        params.from = dayjs().subtract(1, 'month').format("YYYY-MM-DD");
        break;
      case "quarter":
        params.from = dayjs().subtract(3, 'month').format("YYYY-MM-DD");
        break;
      case "year":
        params.from = dayjs().subtract(1, 'year').format("YYYY-MM-DD");
        break;
    }
    listExchangeRates(params).then((result) => {
      setRateSeries(result.items.map((r) => ({ label: r.date, rate: r.rate })));
    });
  }, [selectedCurrency, selectedRange]);

  return (
    <Card sx={{ height: 380 }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">汇率走势</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button size="small" variant="outlined" color='info' onClick={fetchLatestRates}>获取最新汇率</Button>
            <Button size="small" variant="outlined" component="label" disabled={isImporting}>
              导入历史汇率
              <input type="file" hidden accept=".xlsx" onChange={handleImportRates} />
            </Button>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={selectedCurrency}
                onChange={(event: SelectChangeEvent<string>) =>
                  setSelectedCurrency(event.target.value)
                }
              >
                {currencyOptions.map((option) => (
                  <MenuItem key={option.base} value={option.base}>
                    {option.base} / {option.quote}
                  </MenuItem>
                ))}
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
