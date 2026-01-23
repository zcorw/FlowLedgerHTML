import { get } from './client';
import type { InstitutionType } from './types';

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

/**
 * List institution asset changes compared to previous snapshot.
 * GET /custom/institutions/assets/changes
 * Response: InstitutionAssetChangeList
 */
export async function listInstitutionAssetChanges(params?: ListInstitutionAssetChangesParams) {
  return get<InstitutionAssetChangeList>('/custom/institutions/assets/changes', { params });
}
