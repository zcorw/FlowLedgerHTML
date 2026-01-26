import { get } from './client';
import type { InstitutionType } from './types';
import dayjs from 'dayjs';

export type InstitutionAssetChange = {
  institution_id: number;
  institution_name: string;
  institution_type: InstitutionType;
  current_as_of: string; // ISO date-time
  previous_as_of: string; // ISO date-time
  current_total: string; // decimal string, up to 6 decimals
  previous_total: string; // decimal string, up to 6 decimals
  delta: string; // decimal string, may be negative
};

export type InstitutionAssetChangeList = {
  currency: string; // ISO 4217 code
  total: number;
  data: InstitutionAssetChange[];
};

export type ListInstitutionAssetChangesParams = {
  limit?: number;
};

export type LatestTotalAsset = {
  total: string;
  date: string; // ISO date-time
}

export type LatestTotalAssetList = {
  date: string;
  change: number;
  rate: number;
  amount: number;
}

export type MonthlyAssetPoint = {
  month: string;
  amount: number;
}

export type MonthlyAssetResult = {
  currency: string;
  data: MonthlyAssetPoint[];
}

export type MonthlyAssetParams = {
  from?: string;
  to?: string;
  limit?: number;
}

export type CurrencyAssetItem = {
  amount: number;
  change: number;
  rate: number;
  currency: string;
}

export type AssetCurrencyResponse = {
  data: CurrencyAssetItem[]
}

/**
 * List monthly asset history within a date range.
 */
export async function getMonthlyAsset(params: MonthlyAssetParams) {
  return get<MonthlyAssetResult>('/custom/assets/monthly', { params });
}

/**
 * List institution asset changes compared to previous snapshot.
 * GET /custom/institutions/assets/changes
 * Response: InstitutionAssetChangeList
 */
export async function listInstitutionAssetChanges(params?: ListInstitutionAssetChangesParams) {
  return get<InstitutionAssetChangeList>('/custom/institutions/assets/changes', { params });
}

/**
 * List latest total asset.
 * GET /custom/institutions/assets/latest
 * Response: LatestTotalAsset[]
 */
export async function monthlyAssetChange(): Promise<LatestTotalAssetList> {
  const params: MonthlyAssetParams = { 
    limit: 2,
   };
  const result = await getMonthlyAsset(params);
  const change = result.data[0].amount - result.data[1].amount;
  const rate = change / result.data[0].amount;
  return { 
    date: dayjs(result.data[0].month).format('YYYY-MM'),
    change,
    rate,
    amount: result.data[0].amount,
  };
}

/**
 * List total assets by common currencies (including FX assets).
 * GET /custom/assets/summary/by-currency
 * Response: CurrencyAssetSummary[]
 */
export async function listAssetTotalByCurrency() {
  return get<AssetCurrencyResponse>('/custom/total/assets/currency');
}
