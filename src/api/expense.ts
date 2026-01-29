import { del, get, patch, post } from './client';

export type Expense = {
  id: number;
  name: string;
  amount: string; // decimal string, up to 6 decimals
  currency: string; // ISO 4217 code
  category_id: number | null;
  merchant: string | null;
  paid_account_id: number | null;
  occurred_at: string; // ISO date-time
  source_ref: string | null;
  note: string | null;
};

export type ExpenseCreate = Omit<Expense, 'id'>;

export type ExpensePatch = Partial<ExpenseCreate>;

export type ExpenseList = {
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  data: Expense[];
};

export type Category = {
  id: number;
  name: string;
  tax: number;
};

export type CategoryCreate = Omit<Category, 'id'>;

export type CategoryList = {
  data: Category[];
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export type ListExpensesParams = PaginationParams & {
  from?: string; // ISO date-time
  to?: string; // ISO date-time
};

export type ExpenseBatchCreateParams = {
  items: ExpenseCreate[];
};

export type ExpenseBatchCreateResult = {
  total: number;
  created: number;
  failed: number;
  items: Array<{
    index: number;
    status: 'created' | 'failed';
    error?: string | null;
    expense?: Expense | null;
  }>;
};

export type ReceiptImportTaskCreateResponse = {
  task_id: string;
};

export type ReceiptImportTaskStatus<T = unknown> = {
  task_id: string;
  kind?: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  progress?: number;
  stage?: string | null;
  filename?: string | null;
  size?: number | null;
  result?: T | null;
  error?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ReceiptRecognitionItem = {
  name: string;
  amount: number;
  type: string;
}
export type ReceiptRecognitionResult = {
  merchant: string;
  occurred_at: string; // "YYYY-MM-DD HH:mm"
  items: ReceiptRecognitionItem[];
};

const IMPORT_POLL_INTERVAL_MS = 1500;
const IMPORT_POLL_TIMEOUT_MS = 10 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function pollReceiptTask<T>(
  taskId: string,
  fetchStatus: (id: string) => Promise<ReceiptImportTaskStatus<T>>,
) {
  const startedAt = Date.now();
  let latest: ReceiptImportTaskStatus<T> | null = null;

  while (Date.now() - startedAt < IMPORT_POLL_TIMEOUT_MS) {
    latest = await fetchStatus(taskId);
    if (latest.status === 'succeeded') {
      return latest;
    }
    if (latest.status === 'failed') {
      const errorMessage = latest.error || '小票识别失败，请稍后重试';
      const error = new Error(errorMessage);
      (error as { taskStatus?: ReceiptImportTaskStatus<T> }).taskStatus = latest;
      throw error;
    }
    await sleep(IMPORT_POLL_INTERVAL_MS);
  }

  const timeoutError = new Error('小票识别超时，请稍后刷新查看结果');
  (timeoutError as { taskStatus?: ReceiptImportTaskStatus<T> }).taskStatus = latest ?? undefined;
  throw timeoutError;
}

/**
 * Create expense.
 * POST /expenses
 * Request: ExpenseCreate
 * Response: Expense
 */
export async function createExpense(payload: ExpenseCreate, idempotencyKey?: string) {
  return post<Expense>('/expenses', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

/**
 * List expenses with pagination and time range filters.
 * GET /expenses
 * Response: ExpenseList
 */
export async function listExpenses(params?: ListExpensesParams) {
  return get<ExpenseList>('/expenses', { params });
}

/**
 * Get expense by id.
 * GET /expenses/{expense_id}
 * Response: Expense
 */
export async function getExpense(expenseId: number) {
  return get<Expense>(`/expenses/${expenseId}`);
}

/**
 * Update expense by id.
 * PATCH /expenses/{expense_id}
 * Request: ExpensePatch
 * Response: Expense
 */
export async function updateExpense(expenseId: number, payload: ExpensePatch) {
  return patch<Expense>(`/expenses/${expenseId}`, payload);
}

/**
 * Delete expense by id.
 * DELETE /expenses/{expense_id}
 * Response: Expense
 */
export async function deleteExpense(expenseId: number) {
  return del<Expense>(`/expenses/${expenseId}`);
}

/**
 * List categories.
 * GET /categories
 * Response: CategoryList
 */
export async function listCategories() {
  return get<CategoryList>('/categories');
}

/**
 * Create category.
 * POST /categories
 * Request: CategoryCreate
 * Response: Category
 */
export async function createCategory(payload: CategoryCreate, idempotencyKey?: string) {
  return post<Category>('/categories', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

/**
 * Upload expense receipt for OCR.
 * POST /import/expense/receipt
 * Response: ReceiptImportTaskCreateResponse
 */
export async function importExpenseReceipt(file: File | Blob) {
  const formData = new FormData();
  formData.append('file', file);
  const { task_id } = await post<ReceiptImportTaskCreateResponse>('/import/expense/receipt', formData);
  const status = await pollReceiptTask<ReceiptRecognitionResult>(task_id, (id) =>
    get<ReceiptImportTaskStatus<ReceiptRecognitionResult>>(`/import/expense/receipt/tasks/${id}`),
  );
  if (!status.result) {
    throw new Error('识别完成但未返回结果');
  }
  return status.result;
}

/**
 * Batch create expenses.
 * POST /expenses/batch
 * Request: ExpenseBatchCreateParams
 * Response: ExpenseBatchCreateResult
 */
export async function createExpenseBatch(payload: ExpenseBatchCreateParams) {
  return post<ExpenseBatchCreateResult>('/expenses/batch', payload);
}
