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

export type ListExchangeRatesParams = {
  base: string;
  quote?: string;
  date?: string; // ISO date
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
export async function getExchangeRates(params: ListExchangeRatesParams) {
  return get<ExchangeRateResponse>('/exchange-rates', { params });
}

/**
 * Trigger an immediate FX sync.
 * POST /exchange-rates/sync
 * Response: generic object (API returns arbitrary fields)
 */
export async function triggerExchangeRateSync() {
  return post<Record<string, unknown>>('/exchange-rates/sync');
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
  return post<ImportExchangeRateResponse>('/import/exchange-rates', formData);
}