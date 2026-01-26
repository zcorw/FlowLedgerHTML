import { get, patch, post, put } from './client';

export type Currency = {
  code: string; // ISO 4217 code
  name: string;
  symbol?: string | null;
  scale: number; // decimal places (0-6)
};

export type CurrencyPage = {
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  items: Currency[];
};

export type CurrencyUpsert = {
  code: string;
  name: string;
  symbol?: string | null;
  scale: number;
};

export type CurrencyPatch = Partial<{
  name: string | null;
  symbol: string | null;
  scale: number | null;
}>;

export type BulkUpsertResult = {
  code: string;
  status: 'created' | 'updated';
};

export type ExchangeRateSingle = {
  base: string;
  quote: string;
  date: string; // ISO date
  rate: string;
  effective_date: string; // ISO date
};

export type ExchangeRateMapEntry = {
  rate: string;
  effective_date: string; // ISO date
};

export type ExchangeRateMapResponse = {
  base: string;
  date: string; // ISO date
  rates: Record<string, ExchangeRateMapEntry>;
};

export type ExchangeRateResponse = ExchangeRateSingle | ExchangeRateMapResponse;

export type ExchangeRateSyncResponse = Record<string, unknown>;

export type ConvertRequest = {
  amount: string; // decimal string, up to 6 decimals, may be negative
  from: string;
  to: string;
  date?: string; // ISO date
};

export type ConvertResponse = {
  amount: string;
  from_currency: string;
  to_currency: string;
  rate: string;
  converted: string;
  effective_date: string; // ISO date
};

export type ListCurrenciesParams = {
  page?: number;
  page_size?: number;
  code?: string;
  q?: string;
  sort?: string;
};

export type SingleExchangeRateParams = {
  base: string;
  quote?: string;
  date?: string;
};

export type ListExchangeRatesParams = {
  base: string;
  quote: string;
  from: string; // "YYYY-MM-DD"
  to: string; // "YYYY-MM-DD"
};

export type ImportExchangeRateResult = {
  base: string;
  quote: string;
  rate_date: string;
  status: string;
  error?: string;
}

export type ImportExchangeRateResponse = {
  total: number;
  created: number;
  updated: number;
  failed: number;
  items: ImportExchangeRateResult[];
}

export type ImportTaskCreateResponse = {
  task_id: string;
};

export type ImportTaskStatus<T = unknown> = {
  task_id: string;
  kind: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  progress: number;
  stage?: string | null;
  filename?: string | null;
  size?: number | null;
  result?: T | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
};

export type ExchangeRateItem = {
  date: string; // ISO date
  rate: number;
}

export type ExchangeRateRangeResponse = {
  base: string;
  quote: string;
  from_date: string; // ISO date
  to_date: string; // ISO date
  items: ExchangeRateItem[]
}

const IMPORT_POLL_INTERVAL_MS = 1500;
const IMPORT_POLL_TIMEOUT_MS = 10 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function pollImportTask<T>(
  taskId: string,
  fetchStatus: (id: string) => Promise<ImportTaskStatus<T>>,
) {
  const startedAt = Date.now();
  let latest: ImportTaskStatus<T> | null = null;

  while (Date.now() - startedAt < IMPORT_POLL_TIMEOUT_MS) {
    latest = await fetchStatus(taskId);
    if (latest.status === 'succeeded') {
      return latest;
    }
    if (latest.status === 'failed') {
      const errorMessage = latest.error || '导入失败，请稍后重试';
      const error = new Error(errorMessage);
      (error as { taskStatus?: ImportTaskStatus<T> }).taskStatus = latest;
      throw error;
    }
    await sleep(IMPORT_POLL_INTERVAL_MS);
  }

  const timeoutError = new Error('导入超时，请稍后刷新查看结果');
  (timeoutError as { taskStatus?: ImportTaskStatus<T> }).taskStatus = latest ?? undefined;
  throw timeoutError;
}

/**
 * List currencies with pagination and optional filters.
 * GET /currencies
 * Response: CurrencyPage
 */
export async function listCurrencies(params?: ListCurrenciesParams) {
  return get<CurrencyPage>('/currencies', { params });
}

/**
 * Create or replace a currency.
 * POST /currencies
 * Request: CurrencyUpsert | Response: Currency
 */
export async function upsertCurrency(payload: CurrencyUpsert) {
  return post<Currency>('/currencies', payload);
}

/**
 * Get a currency by code.
 * GET /currencies/{code}
 * Response: Currency
 */
export async function getCurrency(code: string) {
  return get<Currency>(`/currencies/${code}`);
}

/**
 * Patch currency fields by code.
 * PATCH /currencies/{code}
 * Request: CurrencyPatch | Response: Currency
 */
export async function updateCurrency(code: string, payload: CurrencyPatch) {
  return patch<Currency>(`/currencies/${code}`, payload);
}

/**
 * Bulk upsert currencies.
 * PUT /currencies/bulk
 * Request: CurrencyUpsert[] | Response: { results: BulkUpsertResult[] }
 */
export async function bulkUpsertCurrencies(payload: CurrencyUpsert[]) {
  return put<{ results: BulkUpsertResult[] }>('/currencies/bulk', payload);
}

/**
 * Get exchange rates for a base currency. Optionally filter by quote and date.
 * GET /exchange-rates
 * Response: ExchangeRateResponse (single or map)
 */
export async function getExchangeRate(params: SingleExchangeRateParams) {
  return get<ExchangeRateResponse>('/exchange-rates', { params });
}

/**
 * List exchange rates for a base currency with date range filters.
 * GET /exchange-rates
 * Response: ExchangeRatePage
 */
export async function listExchangeRates(params?: ListExchangeRatesParams) {
  return get<ExchangeRateRangeResponse>('/exchange-rates/range', { params });
}

/**
 * Trigger an immediate FX sync.
 * POST /exchange-rates/sync
 * Response: ExchangeRateSyncResponse (API returns arbitrary fields)
 */
export async function triggerExchangeRateSync() {
  return post<ExchangeRateSyncResponse>('/exchange-rates/sync');
}

/**
 * Convert an amount between currencies, supports optional idempotency key.
 * POST /convert
 * Request: ConvertRequest | Response: ConvertResponse
 */
export async function convertCurrency(payload: ConvertRequest, idempotencyKey?: string) {
  return post<ConvertResponse>('/convert', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

/**
 * Import exchange rates.
 * POST /import/exchange-rates
 * Response: generic object (API returns arbitrary fields)
 */
export async function importRates(file: File | Blob) {
  const formData = new FormData();
  formData.append('file', file);
  const { task_id } = await post<ImportTaskCreateResponse>('/import/exchange-rates', formData);
  const status = await pollImportTask<ImportExchangeRateResponse>(task_id, (id) =>
    get<ImportTaskStatus<ImportExchangeRateResponse>>(`/import/exchange-rates/tasks/${id}`),
  );
  if (!status.result) {
    throw new Error('导入完成但未返回结果');
  }
  return status.result;
}
