import { del, get, patch, post } from './client';

export type InstitutionType = 'bank' | 'broker' | 'other';

export type ProductType = 'deposit' | 'investment' | 'securities' | 'other';
export type ProductStatus = 'active' | 'inactive' | 'closed';
export type RiskLevel = 'flexible' | 'stable' | 'high_risk';

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

export type BalanceCreate = {
  amount: string;
  as_of: string; // ISO date-time
};

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
 * Bulk import institutions, products, and balances via multipart upload.
 * Expects a FormData with a single `file` field (Excel/CSV supported by backend).
 */
export async function importDeposit(file: File | Blob) {
  const formData = new FormData();
  formData.append('file', file);
  return post<ImportDepositResponse>('/import/deposit', formData);
}

/**
 * 批量写入最新产品余额快照
 */
export async function createLatestBalance(institution_id: number, payload: LatestBalanceBatchParams) {
  return post<LatestBalanceBatchResult>(`/institutions/${institution_id}/products/balances/latest`, payload);
}