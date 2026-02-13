import { del, get, patch, post } from './client';
import type { InstitutionType, RiskLevel, ProductStatus, ProductType } from './types';

export type Institution = {
  id: number;
  name: string;
  type: InstitutionType;
  status: 'active' | 'inactive';
  product_number: number;
};

export type InstitutionList = {
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  data: Institution[];
};

export type InstitutionCreate = {
  name: string;
  type: InstitutionType;
};

export type InstitutionPatch = Partial<InstitutionCreate>;

export type Product = {
  id: number;
  institution_id: number;
  institution_name: string;
  institution_type: InstitutionType;
  name: string;
  product_type: ProductType;
  currency: string;
  status: ProductStatus;
  risk_level: RiskLevel;
  amount: string;
  amount_updated_at: string;
};

export type ProductList = {
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  data: Product[];
};

export type ProductCreate = {
  institution_id: number;
  name: string;
  product_type?: ProductType; // default: deposit
  currency: string;
  status?: ProductStatus; // default: active
  risk_level?: RiskLevel; // default: stable
  amount?: string | null;
};

export type ProductPatch = Partial<Pick<ProductCreate, 'name' | 'product_type' | 'status' | 'risk_level'>>;

export type Balance = {
  id: number;
  product_id: number;
  amount: string; // decimal string with up to 6 decimals
  as_of: string; // ISO date-time
};

export type BalanceList = {
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  data: Balance[];
};

export type ImportSectionResult = {
  total: number;
  created: number;
  exists: number;
  failed: number;
};

export type ImportInstitutionResult = {
  institution_key: string;
  institution_id: number | null;
  status: 'created' | 'exists' | 'failed';
  error?: string | null;
};

export type ImportProductResult = {
  product_key: string;
  institution_key: string;
  product_id: number | null;
  status: 'created' | 'exists' | 'failed';
  error?: string | null;
};

export type ImportBalanceResult = {
  product_key: string;
  as_of: string;
  status: 'created' | 'exists' | 'failed';
  error?: string | null;
};

export type ImportDepositResponse = {
  institutions: ImportSectionResult;
  products: ImportSectionResult;
  product_balances: ImportSectionResult;
  institution_items: ImportInstitutionResult[];
  product_items: ImportProductResult[];
  balance_items: ImportBalanceResult[];
};

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

export type BalanceCreate = {
  amount: string;
  as_of: string; // ISO date-time
};

export type BalancePatch = Partial<BalanceCreate>;

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export type ListInstitutionsParams = PaginationParams & {
  name?: string;
  type?: InstitutionType;
};

export type ListProductsParams = PaginationParams & {
  institution_id?: number;
  product_type?: ProductType;
  status?: ProductStatus;
  risk_level?: RiskLevel;
  currency?: string;
};

export type ListProductBalancesParams = PaginationParams & {
  from?: string; // ISO date-time
  to?: string; // ISO date-time
};

export type ProductStatusParmas = {
  status: ProductStatus;
}

export type LatestBalanceItem = {
  product_id: number;
  amount: string;
  as_of: string;
}

export type LatestBalanceBatchParams = {
  items: LatestBalanceItem[]
};

export type LatestBalanceResult = {
  product_id: number;
  as_of: string;
  status: "created" | "updated" | "failed";
  error?: string;
}

export type LatestBalanceBatchResult = {
  total: number;
  created: number;
  updated: number;
  failed: number;
  items: LatestBalanceResult[];
}

export type InstitutionMostUsed = {
  id: number;
  name: string;
  usage_count: number;
};

export type InstitutionMostUsedList = {
  data: InstitutionMostUsed[];
};

/**
 * 机构列表（分页，可按类型过滤）
 */
export async function listInstitutions(params?: ListInstitutionsParams) {
  return get<InstitutionList>('/institutions', { params });
}

/**
 * 创建机构（支持幂等键）
 */
export async function createInstitution(payload: InstitutionCreate, idempotencyKey?: string) {
  return post<Institution>('/institutions', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

/**
 * 更新机构信息
 */
export async function updateInstitution(id: number, payload: InstitutionPatch) {
  return patch<Institution>(`/institutions/${id}`, payload);
}

/**
 * 删除机构（默认软删除，hard=true 时硬删除）。
 * Header X-Confirm-Delete 必填：软删传 YES，硬删传 HARD-YES。
 */
export async function deleteInstitution(id: number, hard = false) {
  const confirm = hard ? 'HARD-YES' : 'YES';
  return del<Institution>(`/institutions/${id}`, {
    params: { hard },
    headers: { 'X-Confirm-Delete': confirm },
  });
}

/**
 * 产品列表（分页，可按机构/类型/状态/风险过滤）
 */
export async function listProducts(params?: ListProductsParams) {
  return get<ProductList>('/products', { params });
}

/**
 * 创建产品（支持幂等键）
 */
export async function createProduct(payload: ProductCreate, idempotencyKey?: string) {
  return post<Product>('/products', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

/**
 * 更新产品信息
 */
export async function updateProduct(id: number, payload: ProductPatch) {
  return patch<Product>(`/products/${id}`, payload);
}

/**
 * 更新产品状态
 */
export async function updateProductStatus(id: number, payload: ProductStatusParmas) {
  return patch<Product>(`/products/${id}/status`, payload);
}

/**
 * 删除产品（默认软删除，hard=true 时硬删除）。
 * Header X-Confirm-Delete 必填：软删传 YES，硬删传 HARD-YES。
 */
export async function deleteProduct(id: number, hard = false) {
  const confirm = hard ? 'HARD-YES' : 'YES';
  return del<Product>(`/products/${id}`, {
    params: { hard },
    headers: { 'X-Confirm-Delete': confirm },
  });
}

/**
 * 查询产品余额历史（分页，支持时间范围）
 */
export async function listProductBalances(productId: number, params?: ListProductBalancesParams) {
  return get<BalanceList>(`/products/${productId}/balances`, { params });
}

/**
 * 写入产品余额快照
 */
export async function createBalance(productId: number, payload: BalanceCreate) {
  return post<Balance>(`/products/${productId}/balances`, payload);
}

/**
 * 更新产品余额快照
 */
export async function updateBalance(productId: number, balanceId: number, payload: BalancePatch) {
  return patch<Balance>(`/products/${productId}/balances/${balanceId}`, payload);
}

/**
 * 删除产品余额快照
 */
export async function deleteBalance(productId: number, balanceId: number) {
  return del<Balance>(`/products/${productId}/balances/${balanceId}`);
}

/**
 * Bulk import institutions, products, and balances via multipart upload.
 * Expects a FormData with a single `file` field (Excel/CSV supported by backend).
 */
export async function importDeposit(file: File | Blob) {
  const formData = new FormData();
  formData.append('file', file);
  const { task_id } = await post<ImportTaskCreateResponse>('/import/deposit', formData);
  const status = await pollImportTask<ImportDepositResponse>(task_id, (id) =>
    get<ImportTaskStatus<ImportDepositResponse>>(`/import/deposit/tasks/${id}`),
  );
  if (!status.result) {
    throw new Error('导入完成但未返回结果');
  }
  return status.result;
}

/**
 * 批量写入最新产品余额快照
 */
export async function createLatestBalance(institution_id: number, payload: LatestBalanceBatchParams) {
  return post<LatestBalanceBatchResult>(`/institutions/${institution_id}/products/balances/latest`, payload);
}

/**
 * 导出产品余额快照
 */
export async function exportBalances() {
  return get<Blob>(`/export/deposit`, { responseType: 'blob' });
}

/**
 * 获取最常用机构列表。
 */
export async function getMostInstitution(limit: number) {
  return get<InstitutionMostUsedList[]>('/institutions/most-used', { params: { limit } });
}